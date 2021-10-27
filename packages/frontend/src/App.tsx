import React from "react";
import {
    BrowserRouter as Router,
    Switch,
    Route,
    Redirect,
} from "react-router-dom";
import "./App.css";
import { Timeline } from "./features/timeline/Timeline";

const validateDate = (date: string) => {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    return dateRegex.test(date) && !isNaN(new Date(date).getTime());
};

const getCurrentDate = () => {
    const currentDate = new Date();
    return `${currentDate.getFullYear()}-${
        currentDate.getMonth() + 1
    }-${currentDate.getDate()}`;
};

function App() {
    const currentDatePath = `/messages/${getCurrentDate()}`;
    return (
        <Router>
            <div className="App">
                <header className="App-header">
                    <p>Lobster DAO mirror</p>
                </header>
                <div className="App-body">
                    <Switch>
                        <Route exact path="/">
                            <Redirect to={currentDatePath} />
                        </Route>
                        <Route
                            path="/messages/:id"
                            children={(props) => {
                                const dateString = props.match!.params.id;
                                console.log(dateString);
                                if (validateDate(dateString)) {
                                    return <Timeline date={dateString} />;
                                } else {
                                    return <Redirect to="/404.html" />;
                                }
                            }}
                        />
                        <Route path="/404.html">
                            <h1 style={{ textAlign: "center" }}>
                                404 Page not found
                            </h1>
                        </Route>
                        <Route path="*">
                            <Redirect to="/404.html" />
                        </Route>
                    </Switch>
                </div>
            </div>
        </Router>
    );
}

export default App;
