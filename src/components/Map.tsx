import React, { useEffect, useMemo, useState, useRef } from 'react'
import { USAMap, StateAbbreviations } from '@mirawision/usa-map-react'
import { useParams } from 'react-router-dom';
import { supabase } from '../dbClient';
import SharedSession from './SharedSession';

type StateTuple = [string, number];

const MapController = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [hoveredState, setHoveredState] = useState<string | null>(null);
  const [selectedStates, setSelectedStates] = useState<(StateTuple)[]>([]);
  const selectedStatesRef = useRef(selectedStates);
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    selectedStatesRef.current = selectedStates;
  }, [selectedStates]);

  useEffect(() => {
    const fetchSessionData = async () => {

      console.log("Fetching session data for session ID:", sessionId);
      if (!sessionId) return;

      const fetchInitialData = async () => {
        const { data, error } = await supabase
          .from('FoundStates')
          .select('state, id')
          .eq('sessionID', sessionId)
        if (error) {
          console.error("Could not find this game session.");
        } else if (data) {
          const flatStates = data.map((item): StateTuple => [item.state, item.id]);
          console.log("Found states for session", sessionId, ":", flatStates);
          setSelectedStates(flatStates);
        } else {
          setSelectedStates([]);
        }
      }

      await fetchInitialData();

      const channel = supabase
        .channel(`session-${sessionId}`) // Unique channel name
        .on('postgres_changes', {
          event: 'INSERT', // Only listen for new states added
          schema: 'public',
          table: 'FoundStates',
          filter: `sessionID=eq.${sessionId}` // Critical: Only listen for THIS session
        }, (payload) => {
          // Update local state without a new DB query! 
          console.log("Received real-time INSERT for session", sessionId, ":", payload);
          const newState: StateTuple = [payload.new.state, payload.new.id];
          insertLocalStateList(newState);
        })
        .on('postgres_changes', {
          event: 'DELETE',
          schema: 'public',
          table: 'FoundStates',
          filter: `sessionID=eq.${sessionId}`
        }, (payload) => {
          // Handle deletions from other devices
          console.log("Received real-time DELETE for session", sessionId, ":", payload);
          deleteLocalStateList(undefined, payload.old.id);
        })
        .subscribe((status) => {
          console.log("Realtime subscription status:", status);
        });

      // 3. Cleanup: Close the connection when the component unmounts
      return () => {
        supabase.removeChannel(channel);
      };

    };

    fetchSessionData();
  }, [sessionId]);

  const deleteLocalStateList = (state: string | undefined, id: number | undefined) => {
    if (!sessionId) return;
    const currentStates = selectedStatesRef.current
    if (!state && !id) return; // Need at least one identifier to delete

    if (state) {
      const stateIdx = currentStates.findIndex(([s]) => s === state);
      if (stateIdx === -1) return // Not present, do nothing
      setSelectedStates(prev => prev.filter(([s]) => s !== state));
      return
    }

    if (id) {
      const idIdx = currentStates.findIndex(([, sId]) => sId === id);
      if (idIdx === -1) return // Not present, do nothing
      setSelectedStates(prev => prev.filter(s => s[1] !== id));
      return
    }
  }

  const insertLocalStateList = (stateTuple: StateTuple) => {
    if (!sessionId) return;
    const currentStates = selectedStatesRef.current

    const index = currentStates.findIndex(([s]) => s === stateTuple[0]);
    if (index !== -1) return // Already present, do nothing
    setSelectedStates(prev => [...prev, stateTuple]);
  }


  const toggleServerState = async (state: string) => {
    if (!sessionId) return;
    const currentStates = selectedStatesRef.current
    const exists = currentStates.some(([s]) => s === state);
    if (exists) {
      // Remove the state from the list
      const { error } = await supabase
        .from('FoundStates')
        .delete()
        .eq('sessionID', sessionId)
        .eq('state', state);
      if (error) {
        console.error("Error updating state list:", error);
      } else {
        deleteLocalStateList(state, undefined );
      }

    } else {
      // Add the state to the list
      const { data, error } = await supabase
        .from('FoundStates')
        .insert([{ sessionID: sessionId, state: state }])
        .select('state, id')
        .single();
      if (error) {
        console.error("Error updating state list:", error);
      } else if (data) {
        insertLocalStateList([data.state, data.id]);
      }
    }
  };


  const customStates = useMemo(() => {
    const settings: Record<string, any> = {};

    StateAbbreviations.forEach((state) => {
      let fill = undefined;
      let stroke = undefined;

      if (selectedStates.some(([s]) => s === state)) {
        fill = '#abababff';
        stroke = '#000000ff';
      } else if (hoveredState === state) {
        fill = '#1231caff';
        stroke = '#000000ff';
      }

      settings[state] = {
        fill,
        stroke,
        onClick: () => toggleServerState(state),
        onHover: () => setHoveredState(state),
        onLeave: () => setHoveredState(null),
      };
    });

    return settings;
  }, [hoveredState, selectedStates]);

  interface HandleGuessFn {
    (e: React.SubmitEvent<HTMLFormElement>): void;
  }

  const handleGuess: HandleGuessFn = (e) => {
    e.preventDefault();
    console.log("The user guessed:", inputValue);

    toggleServerState(inputValue);

    // Optional: Clear the input after clicking
    setInputValue("");
  };

  return (
    <div className="min-h-dvh flex flex-col gap-6">
      <div>
        <USAMap className="w-full h-full" customStates={customStates} />
      </div>
      <div>
        <form
          onSubmit={handleGuess}
          className="max-w-2xl mx-auto flex gap-2"
        >
          <input
            type="text"
            value={inputValue} // 3. Link the input to state
            onChange={(e) => setInputValue(e.target.value)} // 4. Update state on every keystroke
            placeholder="Type a state name..."
            className="flex-1 px-4 py-3 rounded-lg bg-slate-800 text-white border border-slate-600"
          />
          <button type="submit" className="bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-lg font-bold transition-colors">Set</button>
        </form>
      </div>
      <SharedSession />
    </div>
  );
}

export default MapController; 