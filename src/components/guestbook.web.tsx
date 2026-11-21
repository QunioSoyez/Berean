import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type HostInstance,
} from 'react-native';

import { Heading, Para } from '@/components/info-page';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { GUESTBOOK_LIMITS, TURNSTILE_SITE_KEY } from '@/constants/site';

/**
 * Website guestbook: a sign form (Cloudflare Turnstile + hidden honeypot field) and the list of
 * approved entries. Server side is worker/index.ts; entries only show after Michael approves them.
 */

type Entry = { name: string; city: string; note: string; approved_at: number };

type Turnstile = {
  render(el: HTMLElement, opts: Record<string, unknown>): string;
  reset(id?: string): void;
  remove(id?: string): void;
};
declare global {
  interface Window {
    turnstile?: Turnstile;
  }
}

const API = '/api/guestbook';
let turnstileScript: Promise<void> | null = null;

/** Loads Cloudflare's Turnstile script once. */
function loadTurnstile(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  if (!turnstileScript) {
    turnstileScript = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => {
        turnstileScript = null;
        reject(new Error('Turnstile failed to load'));
      };
      document.head.appendChild(s);
    });
  }
  return turnstileScript;
}

export function Guestbook() {
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [note, setNote] = useState('');
  const [website, setWebsite] = useState(''); // honeypot: stays empty for real people
  const [token, setToken] = useState('');
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [entries, setEntries] = useState<Entry[] | null>(null);

  const startedAt = useRef(Date.now());
  const widgetHost = useRef<HostInstance>(null);
  const widgetId = useRef<string | undefined>(undefined);

  // Approved entries.
  useEffect(() => {
    fetch(API)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d: { entries: Entry[] }) => setEntries(d.entries))
      .catch(() => setEntries([]));
  }, []);

  // Turnstile widget.
  useEffect(() => {
    let cancelled = false;
    loadTurnstile()
      .then(() => {
        const el = widgetHost.current as unknown as HTMLElement | null;
        if (cancelled || !el || !window.turnstile) return;
        widgetId.current = window.turnstile.render(el, {
          sitekey: TURNSTILE_SITE_KEY,
          callback: (t: string) => setToken(t),
          'expired-callback': () => setToken(''),
          'error-callback': () => setToken(''),
        });
      })
      .catch(() =>
        setMessage({ text: 'The bot check could not load. Please refresh the page.', ok: false }),
      );
    return () => {
      cancelled = true;
      if (widgetId.current && window.turnstile) window.turnstile.remove(widgetId.current);
      widgetId.current = undefined;
    };
  }, []);

  const resetWidget = useCallback(() => {
    setToken('');
    if (widgetId.current && window.turnstile) window.turnstile.reset(widgetId.current);
  }, []);

  const canSend = name.trim() && city.trim() && note.trim() && token && !sending;

  async function submit() {
    if (!canSend) return;
    setSending(true);
    setMessage(null);
    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, city, note, website, token, startedAt: startedAt.current }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (res.ok && data.ok) {
        setName('');
        setCity('');
        setNote('');
        startedAt.current = Date.now();
        setMessage({
          text: 'Thank you for signing! Your entry will appear here once it has been reviewed.',
          ok: true,
        });
      } else {
        setMessage({ text: data.error ?? 'Something went wrong. Please try again.', ok: false });
      }
    } catch {
      setMessage({ text: 'Could not reach the server. Please try again.', ok: false });
    } finally {
      setSending(false);
      resetWidget(); // Turnstile tokens work only once.
    }
  }

  return (
    <View>
      <Para>
        Welcome! Let us know you stopped by. Sign with your name, where you’re from, and a short
        note. Entries appear after a quick review.
      </Para>

      <View style={styles.form}>
        <Field label="Name" value={name} onChange={setName} max={GUESTBOOK_LIMITS.name} />
        <Field
          label="City (and state or country)"
          value={city}
          onChange={setCity}
          max={GUESTBOOK_LIMITS.city}
        />
        <Field
          label="Short note"
          value={note}
          onChange={setNote}
          max={GUESTBOOK_LIMITS.note}
          multiline
        />

        {/* Honeypot: hidden from people and screen readers; bots tend to fill it in. */}
        <TextInput
          value={website}
          onChangeText={setWebsite}
          autoComplete="off"
          tabIndex={-1}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          aria-hidden
          style={styles.honeypot}
        />

        <View ref={widgetHost} style={styles.widget} />

        <Pressable
          onPress={submit}
          disabled={!canSend}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.button,
            !canSend && styles.buttonDisabled,
            pressed && styles.pressed,
          ]}>
          {sending ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Sign the guestbook</Text>
          )}
        </Pressable>

        {message && (
          <Text style={[styles.message, !message.ok && styles.error]} accessibilityLiveRegion="polite">
            {message.text}
          </Text>
        )}
        <Para small>No links, please. Your name, city and note will be shown publicly once approved.</Para>
      </View>

      <Heading>Visitors</Heading>
      {entries === null ? (
        <ActivityIndicator color={Colors.navy} style={styles.loading} />
      ) : entries.length === 0 ? (
        <Para small>No entries yet. Be the first to sign!</Para>
      ) : (
        entries.map((e, i) => (
          <View key={`${e.approved_at}-${i}`} style={[styles.entry, i > 0 && styles.entryBorder]}>
            <Text style={styles.entryWho}>
              {e.name} <Text style={styles.entryCity}>· {e.city}</Text>
            </Text>
            <Text style={styles.entryNote}>{e.note}</Text>
            <Text style={styles.entryDate}>
              {new Date(e.approved_at).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </Text>
          </View>
        ))
      )}
    </View>
  );
}

function Field({
  label,
  value,
  onChange,
  max,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  max: number;
  multiline?: boolean;
}) {
  return (
    <View style={styles.field}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.count}>
          {value.length}/{max}
        </Text>
      </View>
      <TextInput
        value={value}
        onChangeText={onChange}
        maxLength={max}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        accessibilityLabel={label}
        style={[styles.input, multiline && styles.inputMulti]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: Spacing.three, marginVertical: Spacing.three },
  field: { gap: Spacing.one },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { fontSize: 14, fontWeight: '600', color: Colors.navy, fontFamily: Fonts.sans },
  count: { fontSize: 12, color: Colors.textSecondary, fontFamily: Fonts.sans },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
    fontSize: 16,
    color: Colors.text,
    fontFamily: Fonts.sans,
    backgroundColor: Colors.background,
  },
  inputMulti: { minHeight: 80, textAlignVertical: 'top' },
  honeypot: { position: 'absolute', left: -10000, width: 1, height: 1, opacity: 0 },
  widget: { minHeight: 65 },
  button: {
    alignItems: 'center',
    paddingVertical: Spacing.three,
    borderRadius: 12,
    backgroundColor: Colors.navy,
  },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', fontFamily: Fonts.sans },
  pressed: { opacity: 0.6 },
  message: { fontSize: 15, lineHeight: 22, color: Colors.navy, fontFamily: Fonts.sans },
  error: { color: Colors.danger },
  loading: { marginVertical: Spacing.three },
  entry: { paddingVertical: Spacing.three, gap: Spacing.one },
  entryBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.border },
  entryWho: { fontSize: 16, fontWeight: '700', color: Colors.text, fontFamily: Fonts.sans },
  entryCity: { fontWeight: '400', color: Colors.textSecondary },
  entryNote: { fontSize: 16, lineHeight: 24, color: Colors.text, fontFamily: Fonts.sans },
  entryDate: { fontSize: 12, color: Colors.textSecondary, fontFamily: Fonts.sans },
});
