import React, { use, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../dbClient';

const SharedSession = () => {
    // 1. Get the 6-character ID from the URL (e.g., /game/A1B2C3)
    const { sessionId } = useParams<{ sessionId: string }>();

    const [sessionName, setSessionName] = useState("");
    const [foundStates, setFoundStates] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        console.log("Form submitted with session ID:", sessionName);
        const { error } = await supabase
            .from('GameSession')
            .insert([{ id: sessionName }]);
        if (error) {
            if (error.code === '23505') { // Unique violation error code
                console.log("Session name already exists:", sessionName);
                navigate(`/game/${sessionName}`);
            } else {
                console.error("Error creating session:", error);
                setError("Failed to create session. Try a different name.");
            }
        } else {
            navigate(`/game/${sessionName}`);
        }
    }

    return (
        <form onSubmit={handleSubmit} aria-label="Shared session form">
            <label>
                Session:
                <input
                    type="text"
                    value={sessionName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSessionName(e.target.value)}
                    placeholder="Enter session name"
                    required
                />
            </label>
            <button type="submit">Play</button>
        </form>
    );
};

export default SharedSession;