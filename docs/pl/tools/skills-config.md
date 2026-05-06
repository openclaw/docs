---
read_when:
    - Dodawanie lub modyfikowanie konfiguracji Skills
    - Dostosowywanie dołączonej listy dozwolonych elementów lub zachowania instalacji
summary: Schemat konfiguracji Skills i przykłady
title: Konfiguracja Skills
x-i18n:
    generated_at: "2026-05-06T09:34:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8996b3df73a9f0176b541c5d3f9670615f9a879a41838cf5d35d0a455e9f5088
    source_path: tools/skills-config.md
    workflow: 16
---

Większość konfiguracji ładowania/instalacji Skills znajduje się w sekcji `skills` w
`~/.openclaw/openclaw.json`. Widoczność Skills specyficzna dla agenta znajduje się w
`agents.defaults.skills` i `agents.list[].skills`.

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills", "~/Projects/oss/some-skill-pack/skills"],
      watch: true,
      watchDebounceMs: 250,
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun (Gateway runtime still Node; bun not recommended)
    },
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // or plaintext string
        env: {
          GEMINI_API_KEY: "GEMINI_KEY_HERE",
        },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

Do wbudowanego generowania/edycji obrazów preferuj `agents.defaults.imageGenerationModel`
wraz z podstawowym narzędziem `image_generate`. `skills.entries.*` jest przeznaczone tylko dla niestandardowych
lub zewnętrznych przepływów pracy Skills.

Jeśli wybierzesz konkretnego dostawcę/model obrazu, skonfiguruj też klucz
uwierzytelniania/API tego dostawcy. Typowe przykłady: `GEMINI_API_KEY` lub `GOOGLE_API_KEY` dla
`google/*`, `OPENAI_API_KEY` dla `openai/*` oraz `FAL_KEY` dla `fal/*`.

Przykłady:

- Natywna konfiguracja w stylu Nano Banana Pro: `agents.defaults.imageGenerationModel.primary: "google/gemini-3-pro-image-preview"`
- Natywna konfiguracja fal: `agents.defaults.imageGenerationModel.primary: "fal/fal-ai/flux/dev"`

## Listy dozwolonych Skills agenta

Użyj konfiguracji agenta, gdy chcesz mieć te same katalogi główne Skills na maszynie/w obszarze roboczym, ale
inny widoczny zestaw Skills dla każdego agenta.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // inherits defaults -> github, weather
      { id: "docs", skills: ["docs-search"] }, // replaces defaults
      { id: "locked-down", skills: [] }, // no skills
    ],
  },
}
```

Zasady:

- `agents.defaults.skills`: wspólna bazowa lista dozwolonych Skills dla agentów, które pomijają
  `agents.list[].skills`.
- Pomiń `agents.defaults.skills`, aby domyślnie nie ograniczać Skills.
- `agents.list[].skills`: jawny końcowy zestaw Skills dla tego agenta; nie jest
  scalany z ustawieniami domyślnymi.
- `agents.list[].skills: []`: nie udostępnia żadnych Skills temu agentowi.

## Pola

- Wbudowane katalogi główne Skills zawsze obejmują `~/.openclaw/skills`, `~/.agents/skills`,
  `<workspace>/.agents/skills` oraz `<workspace>/skills`.
- `allowBundled`: opcjonalna lista dozwolonych tylko dla **pakietowanych** Skills. Po ustawieniu kwalifikują się tylko
  pakietowane Skills z listy (Skills zarządzane, agenta i obszaru roboczego pozostają bez zmian).
- `load.extraDirs`: dodatkowe katalogi Skills do skanowania (najniższy priorytet).
- `load.watch`: obserwuj foldery Skills i odświeżaj migawkę Skills (domyślnie: true).
- `load.watchDebounceMs`: debounce dla zdarzeń obserwatora Skills w milisekundach (domyślnie: 250).
- `install.preferBrew`: preferuj instalatory brew, gdy są dostępne (domyślnie: true).
- `install.nodeManager`: preferencja instalatora node (`npm` | `pnpm` | `yarn` | `bun`, domyślnie: npm).
  Dotyczy to tylko **instalacji Skills**; środowisko wykonawcze Gateway nadal powinno być Node
  (Bun nie jest zalecany dla WhatsApp/Telegram).
  - `openclaw setup --node-manager` ma węższy zakres i obecnie akceptuje `npm`,
    `pnpm` lub `bun`. Ustaw `skills.install.nodeManager: "yarn"` ręcznie, jeśli
    chcesz instalacje Skills oparte na Yarn.
- `entries.<skillKey>`: nadpisania dla poszczególnych Skills.
- `agents.defaults.skills`: opcjonalna domyślna lista dozwolonych Skills dziedziczona przez agentów,
  które pomijają `agents.list[].skills`.
- `agents.list[].skills`: opcjonalna końcowa lista dozwolonych Skills dla danego agenta; jawne
  listy zastępują odziedziczone ustawienia domyślne zamiast je scalać.

Pola dla poszczególnych Skills:

- `enabled`: ustaw `false`, aby wyłączyć Skill, nawet jeśli jest pakietowany/zainstalowany.
- `env`: zmienne środowiskowe wstrzykiwane dla uruchomienia agenta (tylko jeśli nie są już ustawione).
- `apiKey`: opcjonalne ułatwienie dla Skills deklarujących główną zmienną env.
  Obsługuje zwykły ciąg tekstowy lub obiekt SecretRef (`{ source, provider, id }`).

## Uwagi

- Klucze w `entries` domyślnie mapują się na nazwę Skill. Jeśli Skill definiuje
  `metadata.openclaw.skillKey`, użyj zamiast tego tego klucza.
- Priorytet ładowania to `<workspace>/skills` → `<workspace>/.agents/skills` →
  `~/.agents/skills` → `~/.openclaw/skills` → pakietowane Skills →
  `skills.load.extraDirs`.
- Zmiany w Skills są wykrywane w następnej turze agenta, gdy obserwator jest włączony.

### Skills w piaskownicy i zmienne env

Gdy sesja działa w **piaskownicy**, procesy Skills działają wewnątrz skonfigurowanego backendu piaskownicy. Piaskownica **nie** dziedziczy `process.env` hosta.

<Warning>
  Globalne `env` oraz `skills.entries.<skill>.env`/`apiKey` mają zastosowanie tylko do uruchomień na **hoście**. W piaskownicy nie mają żadnego efektu, więc Skill zależny od `GEMINI_API_KEY` zakończy się błędem `apiKey not configured`, chyba że zmienna zostanie przekazana piaskownicy osobno.
</Warning>

Użyj jednego z poniższych:

- `agents.defaults.sandbox.docker.env` dla backendu Docker (lub `agents.list[].sandbox.docker.env` dla danego agenta).
- Wbuduj env w niestandardowy obraz piaskownicy lub zdalne środowisko piaskownicy.

## Powiązane

<CardGroup cols={2}>
  <Card title="Skills" href="/pl/tools/skills" icon="puzzle-piece">
    Czym są Skills i jak się ładują.
  </Card>
  <Card title="Tworzenie Skills" href="/pl/tools/creating-skills" icon="hammer">
    Tworzenie niestandardowych pakietów Skills.
  </Card>
  <Card title="Polecenia ukośnikowe" href="/pl/tools/slash-commands" icon="terminal">
    Natywny katalog poleceń i dyrektywy czatu.
  </Card>
  <Card title="Dokumentacja konfiguracji" href="/pl/gateway/configuration-reference" icon="gear">
    Pełny schemat `skills` i `agents.skills`.
  </Card>
</CardGroup>
