
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const API_URL =
  "https://cart-detective-api.ceemacdee.workers.dev/";

const ORANGE = "#f97316";
const DARK_ORANGE = "#ea580c";
const BG = "#fafaf9";
const TEXT = "#292524";
const MUTED = "#78716c";
const LINE = "#e7e5e4";
const PALE_ORANGE = "#fff7ed";

const FIELDS = [
  {
    key: "productName",
    label: "Product name *",
    placeholder: "e.g. Smiling Strawberry Plush",
  },
  {
    key: "url",
    label: "Product page URL",
    placeholder: "https://yourstore.com/products/example",
    keyboardType: "url",
  },
  {
    key: "price",
    label: "Price",
    placeholder: "e.g. $19.95 AUD",
  },
  {
    key: "description",
    label: "Product description",
    placeholder: "Paste your current product description",
    multiline: true,
  },
  {
    key: "benefits",
    label: "Main benefits",
    placeholder: "What does it do? Why would someone want it?",
    multiline: true,
  },
  {
    key: "shipping",
    label: "Shipping information",
    placeholder: "Costs, delivery estimates and free-shipping conditions",
    multiline: true,
  },
  {
    key: "returns",
    label: "Returns and refunds",
    placeholder: "Your return policy and refund conditions",
    multiline: true,
  },
  {
    key: "reviews",
    label: "Reviews and social proof",
    placeholder: "Review count, customer feedback or testimonials",
    multiline: true,
  },
  {
    key: "images",
    label: "Product images",
    placeholder: "Describe your images, angles and image quality",
    multiline: true,
  },
  {
    key: "audience",
    label: "Target audience",
    placeholder: "Who is most likely to buy this product?",
    multiline: true,
  },
];

const CHECKS = [
  "Clear, specific product title",
  "High-quality product images from useful angles",
  "Clear explanation of product benefits",
  "Price is easy to find and understand",
  "Shipping costs and delivery estimates are clear",
  "Returns and refund information is easy to find",
  "Trust signals, such as genuine customer reviews",
  "Clear call-to-action and buying instructions",
  "Mobile-friendly layout and readable text",
  "No obvious spelling errors or confusing wording",
];

function getText(value) {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    return value.map((item) => getText(item)).join("\n");
  }
  if (typeof value === "object") {
    return Object.entries(value)
      .map(([key, val]) => `${key}: ${getText(val)}`)
      .join("\n");
  }
  return String(value);
}

function Button({ title, onPress, secondary, disabled }) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      activeOpacity={0.8}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.button,
        secondary && styles.secondaryButton,
        disabled && styles.disabledButton,
      ]}
    >
      <Text
        style={[
          styles.buttonText,
          secondary && styles.secondaryButtonText,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}

function Panel({ title, subtitle, children }) {
  return (
    <View style={styles.panel}>
      <Text style={styles.panelTitle}>{title}</Text>
      {subtitle ? (
        <Text style={styles.muted}>{subtitle}</Text>
      ) : null}
      {children}
    </View>
  );
}

export default function App() {
  const [form, setForm] = useState({
    productName: "",
    url: "",
    price: "",
    description: "",
    benefits: "",
    shipping: "",
    returns: "",
    reviews: "",
    images: "",
    audience: "",
  });

  const [checked, setChecked] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [savedReports, setSavedReports] = useState([]);
  const [error, setError] = useState("");

  const checklistScore = checked.length * 10;

  function updateField(key, value) {
    setForm((previous) => ({ ...previous, [key]: value }));
  }

  function toggleCheck(index) {
    setChecked((previous) =>
      previous.includes(index)
        ? previous.filter((item) => item !== index)
        : [...previous, index]
    );
  }

  async function runAudit() {
    if (!form.productName.trim()) {
      Alert.alert(
        "Product name required",
        "Enter a product name before running your audit."
      );
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productName: form.productName.trim(),
          url: form.url.trim(),
          price: form.price.trim(),
          description: form.description.trim(),
          benefits: form.benefits.trim(),
          shipping: form.shipping.trim(),
          returns: form.returns.trim(),
          reviews: form.reviews.trim(),
          images: form.images.trim(),
          audience: form.audience.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(
          data.error || `Audit failed with status ${response.status}.`
        );
      }

      let report = data.report ?? data.audit ?? data;

      if (typeof report === "string") {
        try {
          report = JSON.parse(report);
        } catch {
          report = { assessment: report };
        }
      }

      const rawScore =
        data.score ??
        data.aiScore ??
        report?.score ??
        report?.aiScore;

      const score = Number(rawScore);

      setResult({
        productName: form.productName.trim(),
        score: Number.isFinite(score) ? score : null,
        report,
        raw: JSON.stringify(data, null, 2),
        date: new Date().toLocaleString(),
      });
    } catch (err) {
      setError(
        err.message ||
          "Something went wrong. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  }

  function saveReport() {
    if (!result) return;

    setSavedReports((previous) => [
      { ...result, id: `${Date.now()}` },
      ...previous,
    ]);

    Alert.alert("Report saved", "Your report has been saved in this session.");
  }

  function renderReportSection(title, value) {
    if (
      value == null ||
      value === "" ||
      (Array.isArray(value) && value.length === 0)
    ) {
      return null;
    }

    return (
      <View style={styles.reportSection} key={title}>
        <Text style={styles.reportHeading}>{title}</Text>
        <Text style={styles.reportText}>{getText(value)}</Text>
      </View>
    );
  }

  function renderReport(report) {
    if (typeof report === "string") {
      return <Text style={styles.reportText}>{report}</Text>;
    }

    if (!report || typeof report !== "object") {
      return (
        <Text style={styles.reportText}>
          No readable report was returned.
        </Text>
      );
    }

    const knownSections = [
      ["assessment", "Assessment"],
      ["strengths", "What's working"],
      ["improvements", "Recommended improvements"],
      ["exampleRewrite", "Example rewrite"],
      ["actionToday", "Your next action"],
    ];

    const rendered = knownSections
      .filter(([key]) => report[key] != null)
      .map(([key, title]) =>
        renderReportSection(title, report[key])
      )
      .filter(Boolean);

    if (rendered.length > 0) {
      return rendered;
    }

    return (
      <Text style={styles.reportText}>
        {JSON.stringify(report, null, 2)}
      </Text>
    );
  }

  function showSavedReport(item) {
    setResult(item);
    setError("");
    Alert.alert(
      "Report opened",
      `Showing the saved report for ${item.productName} below.`
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Navigation */}
          <View style={styles.navbar}>
            <View style={styles.brandIcon}>
              <Text style={styles.brandSymbol}>⌕</Text>
            </View>
            <View style={styles.brandWords}>
              <Text style={styles.brandName}>Cart Detective</Text>
              <Text style={styles.brandCaption}>PRODUCT PAGE AUDIT</Text>
            </View>
            <View style={styles.navPill}>
              <View style={styles.liveDot} />
              <Text style={styles.navPillText}>AI AUDIT</Text>
            </View>
          </View>

          {/* Hero */}
          <View style={styles.hero}>
            <View style={styles.eyebrow}>
              <View style={styles.orangeDot} />
              <Text style={styles.eyebrowText}>
                YOUR PRODUCT PAGE INVESTIGATOR
              </Text>
            </View>

            <Text style={styles.heroTitle}>
              Find what's hurting your{" "}
              <Text style={styles.orangeText}>product page.</Text>
            </Text>

            <Text style={styles.heroCopy}>
              Uncover unclear descriptions, missing trust signals and
              overlooked details. Get practical, AI-powered feedback
              you can act on.
            </Text>

            <View style={styles.trustRow}>
              <Text style={styles.trustText}>✓ Simple to use</Text>
              <Text style={styles.trustSeparator}>·</Text>
              <Text style={styles.trustText}>Actionable feedback</Text>
            </View>

            <TouchableOpacity
              style={styles.heroButton}
              onPress={() =>
                Alert.alert(
                  "Start your audit",
                  "Scroll down to enter your product details."
                )
              }
              activeOpacity={0.85}
            >
              <Text style={styles.heroButtonText}>
                Start Free Audit  →
              </Text>
            </TouchableOpacity>

            <View style={styles.previewCard}>
              <View style={styles.previewTop}>
                <View style={styles.previewDots}>
                  <View style={styles.windowDot} />
                  <View style={styles.windowDot} />
                  <View style={styles.windowDot} />
                </View>
                <Text style={styles.previewBadge}>AUDIT PREVIEW</Text>
              </View>

              <Text style={styles.miniLabel}>
                PRODUCT PAGE INFORMATION SCORE
              </Text>

              <View style={styles.previewScoreRow}>
                <View style={styles.previewScore}>
                  <Text style={styles.previewScoreNumber}>78</Text>
                  <Text style={styles.previewScoreOutOf}>/100</Text>
                </View>
                <View style={styles.previewScoreInfo}>
                  <Text style={styles.previewScoreTitle}>
                    Room to improve
                  </Text>
                  <Text style={styles.mutedSmall}>
                    Example score for illustration only.
                  </Text>
                  <View style={styles.track}>
                    <View style={styles.trackFill} />
                  </View>
                </View>
              </View>

              <View style={styles.previewFinding}>
                <View style={styles.findingIcon}>
                  <Text style={styles.findingIconText}>!</Text>
                </View>
                <View style={styles.flex}>
                  <Text style={styles.findingTitle}>
                    Clarify shipping costs
                  </Text>
                  <Text style={styles.findingCopy}>
                    Help shoppers understand the final cost.
                  </Text>
                </View>
              </View>

              <View style={styles.previewFinding}>
                <View style={styles.findingIcon}>
                  <Text style={styles.findingIconText}>✓</Text>
                </View>
                <View style={styles.flex}>
                  <Text style={styles.findingTitle}>
                    Make benefits specific
                  </Text>
                  <Text style={styles.findingCopy}>
                    Explain what makes the product useful.
                  </Text>
                </View>
              </View>

              <Text style={styles.previewDisclaimer}>
                Illustrative preview — not a real audit result.
              </Text>
            </View>
          </View>

          {/* Features */}
          <View style={styles.section}>
            <Text style={styles.sectionEyebrow}>WHAT YOU GET</Text>
            <Text style={styles.sectionTitle}>
              Turn confusing product pages into clearer experiences.
            </Text>
            <Text style={styles.sectionCopy}>
              Spot information gaps and decide what to improve first.
            </Text>

            {[
              ["⌕", "AI-powered audit", "Receive a structured assessment with practical suggestions."],
              ["◎", "Clear score", "See an information-quality score and potential improvements."],
              ["↗", "Actionable feedback", "Get suggested fixes, an example rewrite and a next action."],
            ].map(([symbol, title, description]) => (
              <View style={styles.featureCard} key={title}>
                <View style={styles.featureIcon}>
                  <Text style={styles.featureSymbol}>{symbol}</Text>
                </View>
                <Text style={styles.featureTitle}>{title}</Text>
                <Text style={styles.featureCopy}>{description}</Text>
              </View>
            ))}
          </View>

          {/* Audit */}
          <View style={styles.auditSection}>
            <Text style={styles.sectionEyebrow}>LET'S INVESTIGATE</Text>
            <Text style={styles.sectionTitle}>
              Run your product page audit.
            </Text>
            <Text style={styles.sectionCopy}>
              Enter as much relevant information as you can. The score
              evaluates the information submitted, not guaranteed sales.
            </Text>

            <Panel
              title="Product details"
              subtitle="Fields marked with * are required."
            >
              {FIELDS.map((field) => (
                <View key={field.key}>
                  <Text style={styles.fieldLabel}>{field.label}</Text>
                  <TextInput
                    value={form[field.key]}
                    onChangeText={(value) =>
                      updateField(field.key, value)
                    }
                    placeholder={field.placeholder}
                    placeholderTextColor="#a8a29e"
                    multiline={Boolean(field.multiline)}
                    keyboardType={field.keyboardType || "default"}
                    autoCapitalize={
                      field.key === "url" ? "none" : "sentences"
                    }
                    autoCorrect={field.key !== "url"}
                    textAlignVertical={
                      field.multiline ? "top" : "center"
                    }
                    style={[
                      styles.input,
                      field.multiline && styles.multilineInput,
                    ]}
                  />
                </View>
              ))}

              <TouchableOpacity
                accessibilityRole="button"
                activeOpacity={0.85}
                disabled={loading}
                onPress={runAudit}
                style={[
                  styles.auditButton,
                  loading && styles.disabledButton,
                ]}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.auditButtonText}>
                    Analyse product page  →
                  </Text>
                )}
              </TouchableOpacity>

              {loading ? (
                <Text style={styles.loadingText}>
                  Investigating your product page… this may take a
                  little while.
                </Text>
              ) : null}

              {error ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorTitle}>Audit failed</Text>
                  <Text style={styles.errorText}>{error}</Text>
                  <TouchableOpacity onPress={runAudit}>
                    <Text style={styles.retryText}>Try again →</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </Panel>

            {/* Checklist */}
            <Panel
              title="Page quality checklist"
              subtitle="Mark the details your product page already covers. This self-check is separate from the AI score."
            >
              <View style={styles.checkScoreBox}>
                <Text style={styles.checkScoreNumber}>
                  {checklistScore}
                  <Text style={styles.checkScoreOutOf}> /100</Text>
                </Text>
                <Text style={styles.muted}>
                  {checked.length} of 10 items checked
                </Text>
                <View style={styles.track}>
                  <View
                    style={[
                      styles.checkScoreFill,
                      { width: `${checklistScore}%` },
                    ]}
                  />
                </View>
              </View>

              {CHECKS.map((item, index) => {
                const isChecked = checked.includes(index);

                return (
                  <TouchableOpacity
                    key={item}
                    onPress={() => toggleCheck(index)}
                    activeOpacity={0.8}
                    style={[
                      styles.checkItem,
                      isChecked && styles.checkItemSelected,
                    ]}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        isChecked && styles.checkboxChecked,
                      ]}
                    >
                      {isChecked ? (
                        <Text style={styles.checkboxTick}>✓</Text>
                      ) : null}
                    </View>
                    <Text style={styles.checkText}>{item}</Text>
                  </TouchableOpacity>
                );
              })}
            </Panel>

            {/* Score */}
            <Panel
              title="Product page score"
              subtitle="Your AI score is based on the information you submit."
            >
              <View style={styles.scoreCard}>
                <Text style={styles.scoreNumber}>
                  {result?.score ?? "—"}
                  <Text style={styles.scoreOutOf}> /100</Text>
                </Text>

                <Text style={styles.muted}>
                  {result
                    ? "AI audit completed"
                    : "Run an AI audit to calculate your score."}
                </Text>

                <View style={styles.track}>
                  <View
                    style={[
                      styles.scoreFill,
                      {
                        width: `${Math.max(
                          0,
                          Math.min(100, result?.score ?? 0)
                        )}%`,
                      },
                    ]}
                  />
                </View>
              </View>

              <Text style={styles.muted}>
                The checklist score above is separate from your AI score.
              </Text>
            </Panel>

            {/* Report */}
            <Panel
              title="AI audit report"
              subtitle="Your assessment and recommendations appear here after the audit."
            >
              {!result ? (
                <View style={styles.emptyReport}>
                  <Text style={styles.emptyReportIcon}>⌕</Text>
                  <Text style={styles.emptyReportTitle}>
                    No audit yet
                  </Text>
                  <Text style={styles.muted}>
                    Fill in your product details and tap Analyse product
                    page to get started.
                  </Text>
                </View>
              ) : (
                <View>
                  <View style={styles.resultHeader}>
                    <View style={styles.resultHeaderIcon}>
                      <Text style={styles.resultHeaderSymbol}>✓</Text>
                    </View>
                    <View style={styles.flex}>
                      <Text style={styles.resultTitle}>
                        {result.productName}
                      </Text>
                      <Text style={styles.mutedSmall}>
                        {result.date}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.priorityBox}>
                    <Text style={styles.priorityTitle}>
                      YOUR AUDIT RESULTS
                    </Text>
                    {result.score != null ? (
                      <Text style={styles.priorityScore}>
                        Information score: {result.score}/100
                      </Text>
                    ) : null}
                    {result.report?.actionToday ? (
                      <Text style={styles.priorityText}>
                        Next action:{" "}
                        {getText(result.report.actionToday)}
                      </Text>
                    ) : null}
                  </View>

                  {renderReport(result.report)}

                  <Button
                    title="Save report"
                    onPress={saveReport}
                  />
                </View>
              )}
            </Panel>

            {/* Saved reports */}
            <Panel
              title="Saved reports"
              subtitle="Reports saved during this session appear here."
            >
              {savedReports.length === 0 ? (
                <Text style={styles.muted}>
                  No saved reports yet.
                </Text>
              ) : (
                savedReports.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => showSavedReport(item)}
                    style={styles.savedReport}
                  >
                    <View style={styles.flex}>
                      <Text style={styles.savedReportName}>
                        {item.productName}
                      </Text>
                      <Text style={styles.mutedSmall}>
                        {item.date}
                      </Text>
                    </View>
                    <Text style={styles.savedReportScore}>
                      {item.score != null
                        ? `${item.score}/100`
                        : "View →"}
                    </Text>
                  </TouchableOpacity>
                ))
              )}

              {savedReports.length > 0 ? (
                <Button
                  title="Delete all saved reports"
                  secondary
                  onPress={() =>
                    Alert.alert(
                      "Delete saved reports?",
                      "This removes the saved reports from this session.",
                      [
                        { text: "Cancel", style: "cancel" },
                        {
                          text: "Delete",
                          style: "destructive",
                          onPress: () => setSavedReports([]),
                        },
                      ]
                    )
                  }
                />
              ) : null}
            </Panel>

            {/* Footer */}
            <View style={styles.footer}>
              <View style={styles.footerBrandRow}>
                <View style={styles.footerIcon}>
                  <Text style={styles.brandSymbol}>⌕</Text>
                </View>
                <Text style={styles.footerBrand}>Cart Detective</Text>
              </View>
              <Text style={styles.footerCopy}>
                Cart Detective provides general product-page feedback.
                It cannot guarantee sales, conversions or business
                results. Always verify product claims and policies.
              </Text>
              <Text style={styles.footerCopyright}>
                © {new Date().getFullYear()} Cart Detective
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BG,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  navbar: {
    minHeight: 76,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: LINE,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  brandIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: ORANGE,
    justifyContent: "center",
    alignItems: "center",
  },
  brandSymbol: {
    color: "#ffffff",
    fontSize: 29,
    fontWeight: "700",
    lineHeight: 33,
  },
  brandWords: {
    flex: 1,
  },
  brandName: {
    fontSize: 19,
    fontWeight: "800",
    color: TEXT,
    letterSpacing: -0.5,
  },
  brandCaption: {
    fontSize: 9,
    fontWeight: "800",
    color: MUTED,
    letterSpacing: 1.3,
    marginTop: 2,
  },
  navPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: PALE_ORANGE,
    borderRadius: 30,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: ORANGE,
  },
  navPillText: {
    color: "#c2410c",
    fontSize: 10,
    fontWeight: "800",
  },
  hero: {
    paddingHorizontal: 22,
    paddingTop: 32,
    paddingBottom: 30,
  },
  eyebrow: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 30,
    backgroundColor: PALE_ORANGE,
    marginBottom: 19,
  },
  orangeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: ORANGE,
  },
  eyebrowText: {
    color: "#c2410c",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  heroTitle: {
    color: TEXT,
    fontSize: 39,
    lineHeight: 44,
    fontWeight: "800",
    letterSpacing: -1.8,
    marginBottom: 17,
  },
  orangeText: {
    color: ORANGE,
  },
  heroCopy: {
    color: MUTED,
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 18,
  },
  trustRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 7,
    marginBottom: 21,
  },
  trustText: {
    color: "#57534e",
    fontSize: 11,
    fontWeight: "600",
  },
  trustSeparator: {
    color: "#a8a29e",
  },
  heroButton: {
    alignSelf: "flex-start",
    backgroundColor: ORANGE,
    borderRadius: 11,
    paddingHorizontal: 18,
    paddingVertical: 14,
    marginBottom: 24,
  },
  heroButtonText: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 14,
  },
  previewCard: {
    backgroundColor: "#fff7ed",
    borderWidth: 1,
    borderColor: "#fed7aa",
    borderRadius: 23,
    padding: 12,
  },
  previewTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 17,
  },
  previewDots: {
    flexDirection: "row",
    gap: 5,
  },
  windowDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#d6d3d1",
  },
  previewBadge: {
    color: "#047857",
    backgroundColor: "#ecfdf5",
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 6,
    fontSize: 9,
    fontWeight: "800",
  },
  miniLabel: {
    fontSize: 10,
    color: MUTED,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  previewScoreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
    marginVertical: 17,
  },
  previewScore: {
    width: 82,
    height: 82,
    borderWidth: 7,
    borderColor: "#fed7aa",
    borderRightColor: ORANGE,
    borderRadius: 45,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
  },
  previewScoreNumber: {
    color: TEXT,
    fontSize: 25,
    fontWeight: "800",
    lineHeight: 27,
  },
  previewScoreOutOf: {
    color: MUTED,
    fontSize: 10,
  },
  previewScoreInfo: {
    flex: 1,
  },
  previewScoreTitle: {
    color: TEXT,
    fontWeight: "800",
    fontSize: 14,
    marginBottom: 4,
  },
  mutedSmall: {
    color: MUTED,
    fontSize: 11,
    lineHeight: 16,
  },
  track: {
    height: 8,
    backgroundColor: "#e7e5e4",
    borderRadius: 10,
    overflow: "hidden",
    marginTop: 10,
  },
  trackFill: {
    width: "78%",
    height: "100%",
    backgroundColor: ORANGE,
    borderRadius: 10,
  },
  previewFinding: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: BG,
    borderWidth: 1,
    borderColor: "#f0eeec",
    borderRadius: 12,
    padding: 11,
    marginTop: 9,
  },
  findingIcon: {
    width: 29,
    height: 29,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: PALE_ORANGE,
  },
  findingIconText: {
    color: "#c2410c",
    fontSize: 15,
    fontWeight: "800",
  },
  findingTitle: {
    color: TEXT,
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 3,
  },
  findingCopy: {
    color: MUTED,
    fontSize: 11,
    lineHeight: 16,
  },
  previewDisclaimer: {
    color: MUTED,
    fontSize: 10,
    marginTop: 13,
  },
  section: {
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: LINE,
    paddingHorizontal: 22,
    paddingVertical: 35,
  },
  sectionEyebrow: {
    color: "#c2410c",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 11,
  },
  sectionTitle: {
    color: TEXT,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.9,
    fontWeight: "800",
    marginBottom: 11,
  },
  sectionCopy: {
    color: MUTED,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 21,
  },
  featureCard: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 18,
    padding: 21,
    marginBottom: 13,
    shadowColor: "#292524",
    shadowOpacity: 0.035,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 1,
  },
  featureIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: PALE_ORANGE,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  featureSymbol: {
    color: "#c2410c",
    fontSize: 24,
    fontWeight: "700",
  },
  featureTitle: {
    color: TEXT,
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 7,
  },
  featureCopy: {
    color: MUTED,
    fontSize: 13,
    lineHeight: 21,
  },
  auditSection: {
    backgroundColor: "#f5f5f4",
    borderTopWidth: 1,
    borderTopColor: LINE,
    paddingHorizontal: 16,
    paddingTop: 34,
    paddingBottom: 12,
  },
  panel: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 19,
    padding: 19,
    marginBottom: 17,
    shadowColor: "#292524",
    shadowOpacity: 0.035,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  panelTitle: {
    color: TEXT,
    fontSize: 21,
    lineHeight: 27,
    letterSpacing: -0.5,
    fontWeight: "800",
    marginBottom: 7,
  },
  muted: {
    color: MUTED,
    fontSize: 12,
    lineHeight: 19,
    marginBottom: 8,
  },
  fieldLabel: {
    color: "#44403c",
    fontSize: 13,
    fontWeight: "800",
    marginTop: 13,
    marginBottom: 7,
  },
  input: {
    width: "100%",
    minHeight: 47,
    backgroundColor: BG,
    borderWidth: 1,
    borderColor: "#d6d3d1",
    borderRadius: 11,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: TEXT,
    fontSize: 14,
  },
  multilineInput: {
    minHeight: 85,
    paddingTop: 12,
  },
  button: {
    minHeight: 47,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: ORANGE,
    borderRadius: 11,
    paddingHorizontal: 15,
    paddingVertical: 13,
    marginTop: 12,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "800",
  },
  secondaryButton: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: LINE,
  },
  secondaryButtonText: {
    color: TEXT,
  },
  disabledButton: {
    opacity: 0.65,
  },
  auditButton: {
    minHeight: 51,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: ORANGE,
    borderRadius: 11,
    padding: 14,
    marginTop: 22,
  },
  auditButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "800",
  },
  loadingText: {
    color: MUTED,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 12,
  },
  errorBox: {
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 12,
    padding: 13,
    marginTop: 14,
  },
  errorTitle: {
    color: "#b91c1c",
    fontWeight: "800",
    marginBottom: 5,
  },
  errorText: {
    color: "#b91c1c",
    fontSize: 12,
    lineHeight: 19,
  },
  retryText: {
    color: "#b91c1c",
    fontWeight: "800",
    marginTop: 10,
  },
  checkScoreBox: {
    backgroundColor: BG,
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 14,
    padding: 15,
    marginTop: 10,
    marginBottom: 13,
  },
  checkScoreNumber: {
    color: DARK_ORANGE,
    fontSize: 33,
    fontWeight: "800",
  },
  checkScoreOutOf: {
    color: MUTED,
    fontSize: 15,
    fontWeight: "500",
  },
  checkScoreFill: {
    height: "100%",
    backgroundColor: ORANGE,
    borderRadius: 10,
  },
  checkItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 11,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  checkItemSelected: {
    borderColor: "#fdba74",
    backgroundColor: "#fffaf5",
  },
  checkbox: {
    width: 21,
    height: 21,
    borderWidth: 1.5,
    borderColor: "#d6d3d1",
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  checkboxChecked: {
    backgroundColor: ORANGE,
    borderColor: ORANGE,
  },
  checkboxTick: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "800",
  },
  checkText: {
    color: "#44403c",
    fontSize: 12,
    lineHeight: 19,
    flex: 1,
  },
  scoreCard: {
    backgroundColor: BG,
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 15,
    padding: 19,
    marginTop: 11,
    marginBottom: 12,
  },
  scoreNumber: {
    color: DARK_ORANGE,
    fontSize: 45,
    fontWeight: "800",
    lineHeight: 54,
  },
  scoreOutOf: {
    color: MUTED,
    fontSize: 16,
    fontWeight: "500",
  },
  scoreFill: {
    height: "100%",
    backgroundColor: ORANGE,
    borderRadius: 10,
  },
  emptyReport: {
    alignItems: "center",
    paddingVertical: 25,
  },
  emptyReportIcon: {
    color: ORANGE,
    fontSize: 43,
    fontWeight: "700",
    marginBottom: 7,
  },
  emptyReportTitle: {
    color: TEXT,
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 7,
  },
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    marginTop: 10,
    marginBottom: 16,
  },
  resultHeaderIcon: {
    width: 39,
    height: 39,
    borderRadius: 12,
    backgroundColor: "#ecfdf5",
    alignItems: "center",
    justifyContent: "center",
  },
  resultHeaderSymbol: {
    color: "#047857",
    fontSize: 20,
    fontWeight: "800",
  },
  resultTitle: {
    color: TEXT,
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 3,
  },
  priorityBox: {
    backgroundColor: PALE_ORANGE,
    borderWidth: 1,
    borderColor: "#fed7aa",
    borderRadius: 12,
    padding: 14,
    marginBottom: 17,
  },
  priorityTitle: {
    color: "#c2410c",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 7,
  },
  priorityScore: {
    color: TEXT,
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 7,
  },
  priorityText: {
    color: "#44403c",
    fontSize: 13,
    lineHeight: 20,
  },
  reportSection: {
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: LINE,
  },
  reportHeading: {
    color: TEXT,
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 7,
  },
  reportText: {
    color: "#44403c",
    fontSize: 13,
    lineHeight: 22,
  },
  savedReport: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: LINE,
  },
  savedReportName: {
    color: TEXT,
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 4,
  },
  savedReportScore: {
    color: DARK_ORANGE,
    fontSize: 13,
    fontWeight: "800",
  },
  footer: {
    paddingTop: 25,
    paddingBottom: 18,
  },
  footerBrandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginBottom: 13,
  },
  footerIcon: {
    width: 33,
    height: 33,
    borderRadius: 10,
    backgroundColor: ORANGE,
    justifyContent: "center",
    alignItems: "center",
  },
  footerBrand: {
    color: TEXT,
    fontSize: 17,
    fontWeight: "800",
  },
  footerCopy: {
    color: MUTED,
    fontSize: 11,
    lineHeight: 18,
    marginBottom: 12,
  },
  footerCopyright: {
    color: MUTED,
    fontSize: 11,
  },
});
