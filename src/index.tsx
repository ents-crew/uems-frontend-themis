// eslint-disable-next-line import/no-extraneous-dependencies
import JavascriptTimeAgo from 'javascript-time-ago';
// eslint-disable-next-line import/no-extraneous-dependencies
import en from 'javascript-time-ago/locale/en';

import React from 'react';
import ReactDOM from 'react-dom';
import './pages/index/index.scss';
import './pages/index/flexboxgrid.css';
import { BrowserRouter, NavLink, Route, Switch } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faBox,
    faCalendarTimes,
    faColumns,
    faPaperPlane,
    faWrench,
    IconDefinition
} from '@fortawesome/free-solid-svg-icons';
import moment from 'moment';
import App from './pages/App';
import { Events } from './pages/events/Events';
import Event from './pages/event/Event';

import 'react-dates/initialize';
import 'react-loader-spinner/dist/loader/css/react-spinner-loader.css';
import 'flatpickr/dist/themes/material_green.css';
import { User } from './types/Event';
import { GlobalContext, GlobalContextType, ReadableContextType } from './context/GlobalContext';
import {
    Notification,
    NotificationRenderer,
    processNotifications
} from './components/components/notification-renderer/NotificationRenderer';
import { NotificationContext } from './context/NotificationContext';
import { v4 } from 'uuid';
import { CreateEvent } from "./pages/event/create/CreateEvent";

// Register EN locale for time ago components
JavascriptTimeAgo.addLocale(en);

// Set moment rounding thresholds to get more useful relative times
moment.relativeTimeThreshold('s', 60);
moment.relativeTimeThreshold('m', 60);
moment.relativeTimeThreshold('h', 24);
moment.relativeTimeThreshold('d', 31);
moment.relativeTimeThreshold('M', 12);
moment.relativeTimeThreshold('y', 365);

type RootSiteState = {
    notifications: Notification[],
    timeouts: { [key: string]: number },
    animationStates: { [key: string]: string }
}

class RootSite extends React.Component<{}, RootSiteState & ReadableContextType> {

    constructor(props: Readonly<{}>) {
        super(props);

        this.state = {
            notifications: [],
            timeouts: {},
            animationStates: {},
        };
    }

    componentWillUnmount() {
        Object.values(this.state.timeouts).map(clearTimeout);
    }

    private setUser = (user?: User) => {
        this.setState((oldState) => ({
            ...oldState,
            user,
        }));
    }

    private clearNotifications = () => {
        const size = this.state.notifications.length;

        this.setState((oldState) => ({
            ...oldState,
            notifications: [],
        }));

        Object.values(this.state.timeouts).map(clearTimeout);

        return size;
    }

    private clearNotification = (id: string, skipTimeout: boolean = false) => {
        const newNotifications = this.state.notifications.filter((e) => e.id !== id);

        if (newNotifications.length === this.state.notifications.length) {
            return false;
        }

        if (!skipTimeout && Object.prototype.hasOwnProperty.call(this.state.timeouts, id)) {
            clearTimeout(this.state.timeouts[id]);
        }

        this.setState((oldState) => ({
            ...oldState,
            notifications: [...newNotifications],
        }));

        return true;
    }

    private showNotification = (
        title: string,
        content?: string,
        icon?: IconDefinition,
        color?: string,
        action?: Notification['action'],
    ) => {
        const id = v4();

        this.setState((oldState) => {
            const newState = {
                ...oldState,
                notifications: oldState.notifications.concat([{
                    id,
                    title,
                    content,
                    icon,
                    color,
                    action,
                }]),
            };

            // @ts-ignore
            newState.timeouts[id] = setTimeout(() => {
                this.setState((prevState) => {
                    const newStates = { ...prevState };

                    // Add the leaving state
                    newStates.animationStates[id] = 'leaving';

                    // Schedule it to be removed in 1 1/2 second once the animation is done
                    // @ts-ignore
                    newStates.timeouts[id] = setTimeout(() => {
                        this.clearNotification(id, true);
                    }, 1500);

                    return newStates;
                });
            }, 5000);

            return newState;
        });

        return id;
    }

    render() {
        const providedContext = {
            user: {
                value: this.state.user,
                set: this.setUser,
            },
        } as GlobalContextType;

        return (
            <React.StrictMode>
                <GlobalContext.Provider value={providedContext}>
                    <NotificationContext.Provider value={{
                        clearNotifications: this.clearNotifications,
                        clearNotification: this.clearNotification,
                        showNotification: this.showNotification,
                    }}
                    >
                        <BrowserRouter>
                            <NotificationRenderer
                                position="top-right"
                                notifications={
                                    processNotifications(this.state.notifications, this.state.animationStates)
                                }
                            />
                            <div className="sidebar-real">
                                <img
                                    src="/ents-crew-white.png"
                                    className="header-image"
                                    alt="UEMS Logo:
                                    The text UEMS in a bold geometric font surrounded by a white outlined rectangle."
                                />
                                <div className="sidebar-content">
                                    <NavLink exact to="/" className="entry">
                                        <FontAwesomeIcon icon={faColumns} />
                                        <span>Dashboard</span>
                                    </NavLink>
                                    <NavLink to="/events" className="entry">
                                        <FontAwesomeIcon icon={faCalendarTimes} />
                                        <span>Events</span>
                                    </NavLink>
                                    <NavLink to="/equipment" className="entry">
                                        <FontAwesomeIcon icon={faBox} />
                                        <span>Equipment</span>
                                    </NavLink>
                                    <NavLink to="/ents" className="entry">
                                        <FontAwesomeIcon icon={faWrench} />
                                        <span>Ents</span>
                                    </NavLink>
                                    <NavLink to="/ops-planning" className="entry">
                                        <FontAwesomeIcon icon={faPaperPlane} />
                                        <span>Ops Planning</span>
                                    </NavLink>
                                </div>
                            </div>

                            <div className="sidebar-spacer" />

                            <div className="content">
                                <Switch>
                                    <Route path="/event/create" exact>
                                        <CreateEvent isPage />
                                    </Route>
                                    <Route path="/events/:id" exact>
                                        <Event />
                                    </Route>
                                    <Route path="/events" exact>
                                        <Events />
                                    </Route>
                                    <Route path="/" exact>
                                        <App />
                                    </Route>
                                </Switch>
                            </div>
                        </BrowserRouter>
                    </NotificationContext.Provider>
                </GlobalContext.Provider>
            </React.StrictMode>
        );
    }

}

ReactDOM.render(
    <RootSite />,
    document.getElementById('root'),
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
// serviceWorker.unregister();
