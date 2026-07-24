import { Component, ErrorInfo, ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  children: ReactNode;
};

type State = {
  error: Error | null;
};

export class GlobalErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[Momentra] Unhandled render error", error, info.componentStack);
  }

  reset = () => {
    if (typeof window !== "undefined") {
      window.location.reload();
      return;
    }

    this.setState({ error: null });
  };

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    return (
      <View style={styles.screen}>
        <View style={styles.card}>
          <Text style={styles.eyebrow}>MOMENTRA</Text>
          <Text style={styles.title}>Refresh this screen.</Text>
          <Text style={styles.body}>
            A temporary screen issue interrupted loading. Refresh once and Momentra will reopen cleanly.
          </Text>
          <Pressable onPress={this.reset} style={styles.button}>
            <Text style={styles.buttonText}>Try again</Text>
          </Pressable>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  body: { color: "rgba(242,232,217,0.68)", fontSize: 14, lineHeight: 22, marginBottom: 22, textAlign: "center" },
  button: { alignItems: "center", backgroundColor: "#8B1A10", borderRadius: 14, height: 48, justifyContent: "center" },
  buttonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },
  card: {
    backgroundColor: "#1A0E08",
    borderColor: "rgba(201,151,90,0.18)",
    borderRadius: 24,
    borderWidth: 1,
    maxWidth: 420,
    padding: 24,
    width: "90%",
  },
  eyebrow: { color: "#C9975A", fontSize: 11, fontWeight: "800", letterSpacing: 2.4, marginBottom: 10, textAlign: "center" },
  screen: { alignItems: "center", backgroundColor: "#0D0905", flex: 1, justifyContent: "center", padding: 20 },
  title: { color: "#F2E8D9", fontSize: 24, fontWeight: "800", lineHeight: 30, marginBottom: 10, textAlign: "center" },
});
