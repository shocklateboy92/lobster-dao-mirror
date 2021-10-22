import React from "react";
import logo from "./logo.svg";
import "./App.css";
import { Timeline } from "./features/timeline/Timeline";

function App() {
    return (
        <div className="App">
            <header className="App-header">
                <p>Lobster DAO mirror</p>
            </header>
            <Timeline date="2021-9-21" />
        </div>
    );
}

export default App;
