import React, { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error) {
    console.error("DDCS UI error:", error);
  }
  render() {
    if (this.state.failed) {
      return <main className="errorPage">
        <h1>We’re fixing a display issue</h1>
        <p>Please reload the store. Your saved cart is kept where possible.</p>
        <button onClick={() => window.location.reload()}>Reload store</button>
      </main>;
    }
    return this.props.children;
  }
}
