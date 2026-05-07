import React, { useState } from "react";
import Registration from "./screens/Registration";
import Interview from "./screens/Interview";
import Results from "./screens/Results";

export default function App() {
  const [screen, setScreen] = useState("register");
  const [candidate, setCandidate] = useState(null);
  const [result, setResult] = useState(null);

  return (
    <>
      {screen === "register" && (
        <Registration
          onRegister={(data) => {
            setCandidate(data);
            setScreen("interview");
          }}
        />
      )}

      {screen === "interview" && (
        <Interview
          candidate={candidate}
          onComplete={(res) => {
            setResult(res);
            setScreen("result");
          }}
        />
      )}

      {screen === "result" && <Results result={result} />}
    </>
  );
}