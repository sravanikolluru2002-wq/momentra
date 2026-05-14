import { ReactNode } from "react";
import { Platform, StyleSheet, View } from "react-native";

type WebLayoutProps = {
  children: ReactNode;
  landing?: boolean;
};

export function WebLayout({ children, landing = false }: WebLayoutProps) {
  if (Platform.OS !== "web") {
    return <>{children}</>;
  }

  return (
    <View style={[styles.root, landing && styles.landingRoot]}>
      <View style={[styles.surface, landing && styles.landingSurface]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: "stretch",
    backgroundColor: "#050302",
    flex: 1,
    minHeight: "100%",
    overflow: "hidden",
    width: "100%",
  },
  landingRoot: {
    backgroundColor: "#050302",
  },
  surface: {
    backgroundColor: "#0D0905",
    flex: 1,
    maxWidth: "100%",
    minHeight: "100%",
    overflow: "hidden",
    width: "100%",
  },
  landingSurface: {
    backgroundColor: "#050302",
  },
});
