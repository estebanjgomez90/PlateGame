import React, { act, use, useEffect, useMemo, useState } from 'react'
import { USAMap, StateAbbreviations } from '@mirawision/usa-map-react'
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../dbClient';
import SharedSession from './SharedSession';

const MapController = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [foundStates, setFoundStates] = useState<string[]>([]);
  const [hoveredState, setHoveredState] = useState<string | null>(null);
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    const fetchSessionData = async () => {

      console.log("Fetching session data for session ID:", sessionId);
      if (!sessionId) return;

      const fetchInitialData = async () => {
        const { data, error } = await supabase
          .from('FoundStates')
          .select('state')
          .eq('sessionID', sessionId)
        if (error) {
          setError("Could not find this game session.");
        } else if (data) {
          const flatStates = data.map(item => item.state);
          console.log("Found states for session", sessionId, ":", flatStates);
          setSelectedStates(flatStates);
        } else {
          setSelectedStates([]);
        }
      }

      fetchInitialData();

      const channel = supabase
        .channel(`session-${sessionId}`) // Unique channel name
        .on('postgres_changes', {
          event: 'INSERT', // Only listen for new states added
          schema: 'public',
          table: 'FoundStates',
          filter: `sessionID=eq.${sessionId}` // Critical: Only listen for THIS session
        }, (payload) => {
          // Update local state without a new DB query! 
          setFoundStates((prev) => [...prev, payload.new.state_code]);
        })
        .subscribe();

      // 3. Cleanup: Close the connection when the component unmounts
      return () => {
        supabase.removeChannel(channel);
      };

    };

    fetchSessionData();
  }, [sessionId]);

  const updateStateList = async (state: string) => {
    if (!sessionId) return;

    console.log("Updating state list for session", sessionId, "with state:", state);
    const { error } = await supabase
      .from('FoundStates')
      .insert([{ sessionID: sessionId, state: state }]);
    if (error) {
      console.error("Error updating state list:", error);
    }

    setSelectedStates(prev => prev.includes(state) ? prev : [...prev, state]);

  };


  const customStates = useMemo(() => {
    const settings: Record<string, any> = {};

    StateAbbreviations.forEach((state) => {
      let fill = undefined;
      let stroke = undefined;

      if (selectedStates.includes(state)) {
        fill = '#abababff';
        stroke = '#000000ff';
      } else if (hoveredState === state) {
        fill = '#1231caff';
        stroke = '#000000ff';
      }

      settings[state] = {
        fill,
        stroke,
        onClick: () => updateStateList(state),
        onHover: () => setHoveredState(state),
        onLeave: () => setHoveredState(null),
      };
    }, [selectedStates]);

    return settings;
  }, [hoveredState, selectedStates]);

  interface HandleGuessFn {
    (e: React.SubmitEvent<HTMLFormElement>): void;
  }

  const handleGuess: HandleGuessFn = (e) => {
    e.preventDefault();
    console.log("The user guessed:", inputValue);

    updateStateList(inputValue);

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