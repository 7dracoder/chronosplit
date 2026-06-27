import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

type ParallelYouEmailProps = {
  name: string;
  vibe: string;
  dreamCity: string;
  secretTalent: string;
  wildGoal?: string | null;
  thisTimeline: string;
  alternateTimeline: string;
};

export function ParallelYouEmail({
  name,
  vibe,
  dreamCity,
  secretTalent,
  wildGoal,
  thisTimeline,
  alternateTimeline,
}: ParallelYouEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your Parallel You Timeline from ChronoSplit! 🌈</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>ChronoSplit 🎪</Heading>
          <Text style={text}>
            Hey {name}! Thanks for stepping into the multiverse!
          </Text>

          <Section style={section}>
            <Heading as="h2" style={h2}>
              Your Answers ✨
            </Heading>
            <Text style={bullet}>Vibe: {vibe}</Text>
            <Text style={bullet}>Dream city: {dreamCity}</Text>
            <Text style={bullet}>Secret talent: {secretTalent}</Text>
            {wildGoal && <Text style={bullet}>Wild goal: {wildGoal}</Text>}
          </Section>

          <Hr style={hr} />

          <Section style={section}>
            <Heading as="h2" style={h2}>
              This Timeline You 🌍
            </Heading>
            <Text style={text}>{thisTimeline}</Text>
          </Section>

          <Section style={section}>
            <Heading as="h2" style={h2}>
              Alternate Timeline You 🪐
            </Heading>
            <Text style={text}>{alternateTimeline}</Text>
          </Section>

          <Hr style={hr} />

          <Text style={badge}>
            🌌 You&apos;ve unlocked the Multiverse Explorer badge!
          </Text>

          <Text style={footer}>
            Stories are fictional and for fun only. ChronoSplit booth.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#fff5fb",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const container = {
  margin: "0 auto",
  padding: "32px 24px",
  maxWidth: "560px",
  backgroundColor: "#ffffff",
  borderRadius: "24px",
  border: "3px solid #2d1b4e",
};

const h1 = {
  color: "#ff6bcb",
  fontSize: "32px",
  fontWeight: "800" as const,
  margin: "0 0 24px",
};

const h2 = {
  color: "#2d1b4e",
  fontSize: "18px",
  fontWeight: "700" as const,
  margin: "0 0 12px",
};

const text = {
  color: "#4a3566",
  fontSize: "15px",
  lineHeight: "24px",
  margin: "0 0 12px",
};

const bullet = {
  color: "#6b5b80",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "0 0 4px",
  fontWeight: "600" as const,
};

const section = {
  margin: "0 0 24px",
};

const hr = {
  borderColor: "#ffc4ec",
  margin: "24px 0",
};

const badge = {
  color: "#ff6bcb",
  fontSize: "16px",
  fontWeight: "700" as const,
  textAlign: "center" as const,
  margin: "24px 0",
};

const footer = {
  color: "#9b8aad",
  fontSize: "12px",
  textAlign: "center" as const,
  margin: "24px 0 0",
};

export default ParallelYouEmail;
