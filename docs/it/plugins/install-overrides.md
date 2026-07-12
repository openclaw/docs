---
read_when:
    - Test dei flussi di onboarding o configurazione con un plugin pacchettizzato localmente
    - Verifica di un pacchetto Plugin prima della pubblicazione
    - Sostituzione dell'installazione automatica di un plugin con un artefatto di test
sidebarTitle: Install overrides
summary: Testare le sostituzioni dei Plugin inclusi nel pacchetto con i flussi di installazione durante la configurazione
title: Override dell'installazione dei Plugin
x-i18n:
    generated_at: "2026-07-12T07:16:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: adc823f49ea9f8fa86e6a89933e43fdc309d808ac24397770495dbe81cb4b0d7
    source_path: plugins/install-overrides.md
    workflow: 16
---

Gli override per l'installazione dei Plugin consentono ai manutentori di fare in modo che le installazioni dei Plugin durante la configurazione usino uno specifico pacchetto npm o un tarball locale creato con `npm pack`, anziché la fonte del catalogo, quella inclusa o quella npm predefinita. Sono disponibili esclusivamente per la convalida E2E e dei pacchetti; gli utenti normali installano i Plugin con
[`openclaw plugins install`](/it/cli/plugins).

<Warning>
Gli override eseguono il codice del Plugin dalla fonte fornita. Usali solo in una directory di stato isolata o su una macchina di test temporanea.
</Warning>

## Ambiente

Gli override sono disabilitati, a meno che non siano impostate entrambe le variabili:

```bash
export OPENCLAW_ALLOW_PLUGIN_INSTALL_OVERRIDES=1
export OPENCLAW_PLUGIN_INSTALL_OVERRIDES='{
  "codex": "npm-pack:/tmp/openclaw-codex-2026.5.8.tgz",
  "openclaw-web-search": "npm:@openclaw/web-search@2026.5.8"
}'
```

La mappa degli override è un oggetto JSON le cui chiavi sono gli ID dei Plugin. I valori supportano:

| Prefisso              | Fonte                                                                                            |
| --------------------- | ------------------------------------------------------------------------------------------------ |
| `npm:<registry-spec>` | Pacchetti del registro, versioni esatte o tag                                                     |
| `npm-pack:<path.tgz>` | Tarball locali prodotti da `npm pack`; i percorsi relativi vengono risolti dalla directory di lavoro corrente |

## Comportamento

Quando un flusso di configurazione installa un Plugin il cui ID è presente nella mappa, OpenClaw usa la fonte dell'override anziché la fonte del catalogo, quella inclusa o quella npm predefinita. Ciò si applica all'onboarding e a qualsiasi altro flusso che utilizzi il programma di installazione condiviso dei Plugin durante la configurazione.

- Gli override continuano a imporre l'ID del Plugin previsto: un tarball associato a `codex` deve installare un Plugin il cui ID nel manifest sia `codex`.
- Gli override non ereditano lo stato di fonte ufficiale attendibile. Anche quando la voce del catalogo rappresenta normalmente un pacchetto appartenente a OpenClaw, un override viene trattato come input di test fornito dall'operatore.
- I file `.env` dell'area di lavoro non possono abilitare gli override di installazione; entrambe le variabili di ambiente sono incluse nell'elenco dotenv bloccato per l'area di lavoro. Impostale nella shell attendibile, nel processo CI o nel comando di test remoto che avvia OpenClaw.

## E2E del pacchetto

Usa una directory di stato isolata affinché le installazioni dei pacchetti e i relativi record non modifichino il normale stato di OpenClaw:

```bash
npm pack extensions/codex --pack-destination /tmp

OPENCLAW_STATE_DIR="$(mktemp -d)" \
OPENCLAW_ALLOW_PLUGIN_INSTALL_OVERRIDES=1 \
OPENCLAW_PLUGIN_INSTALL_OVERRIDES='{"codex":"npm-pack:/tmp/openclaw-codex-2026.5.8.tgz"}' \
pnpm openclaw onboard --mode local
```

Verifica il pacchetto installato nella directory di stato:

```bash
find "$OPENCLAW_STATE_DIR/npm/projects" -path '*/node_modules/@openclaw/codex/package.json' -print
grep -R '"@openclaw/codex"' "$OPENCLAW_STATE_DIR/npm/projects"/*/package-lock.json
```

Per l'E2E di un provider reale, carica la chiave API reale da una shell attendibile o da un segreto CI prima di avviare il comando di test. Non stampare le chiavi; indica solo la fonte e se la chiave era presente.
