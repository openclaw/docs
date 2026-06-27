---
read_when:
    - Scegliere auto, ask, allowlist, full o deny per le autorizzazioni dei comandi
    - Configurare le approvazioni revisionate da Codex Guardian tramite tools.exec.mode
    - Confronto tra le approvazioni exec di OpenClaw e le autorizzazioni dell’harness ACPX
summary: Modalità di autorizzazione per l'esecuzione sull'host, le approvazioni di Codex Guardian e le sessioni dell'harness ACPX
title: Modalità di autorizzazione
x-i18n:
    generated_at: "2026-06-27T18:22:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6ce89cadb45b3b96ce9ab62b35c06610d02f0ff02f15ef7d2128c59fbebb325a
    source_path: tools/permission-modes.md
    workflow: 16
---

Le modalità di autorizzazione decidono quanta autorità ha un agente prima di poter eseguire comandi host, scrivere file o chiedere a un harness backend accesso aggiuntivo. Inizia con `tools.exec.mode: "auto"` quando vuoi che OpenClaw usi prima le allowlist, poi l'auto-review nativa di Codex o un percorso di approvazione umana per le mancate corrispondenze.

<Note>
  La modalità di autorizzazione è separata da `tools.exec.host=auto`. `tools.exec.host`
  sceglie dove viene eseguito un comando. `tools.exec.mode` sceglie come viene
  approvato l'exec host.
</Note>

## Predefinito consigliato

Usa `auto` per gli agenti di coding che hanno bisogno di accesso host utile senza trasformare ogni mancata corrispondenza in una richiesta a una persona:

```bash
openclaw config set tools.exec.mode auto
openclaw approvals get
openclaw gateway restart
```

Poi verifica la policy effettiva:

```bash
openclaw exec-policy show
```

In modalità `auto`, OpenClaw esegue direttamente le corrispondenze deterministiche della allowlist. Le mancate approvazioni passano prima dal revisore automatico nativo di OpenClaw, poi ripiegano sul percorso di approvazione umana configurato quando necessario.

## Modalità exec host di OpenClaw

`tools.exec.mode` è la superficie di policy normalizzata per `exec` host.

| Modalità    | Comportamento                                  | Usa quando                                             |
| ----------- | ---------------------------------------------- | ------------------------------------------------------ |
| `deny`      | Blocca exec host.                              | Non sono consentiti comandi host.                      |
| `allowlist` | Esegue solo comandi in allowlist.              | Hai un insieme di comandi noti come sicuri.            |
| `ask`       | Esegue le corrispondenze allowlist e chiede sulle mancate corrispondenze. | Una persona deve rivedere i nuovi comandi. |
| `auto`      | Esegue le corrispondenze allowlist, poi usa l'auto-review. | Le sessioni di coding hanno bisogno di accesso pratico e sorvegliato. |
| `full`      | Esegue exec host senza richieste.              | Questo host/sessione attendibile deve saltare i gate di approvazione. |

Per la policy exec host completa, il file locale delle approvazioni, lo schema allowlist, i binari sicuri e il comportamento di inoltro, consulta [Approvazioni exec](/it/tools/exec-approvals).

## Mappatura Codex Guardian

Per le sessioni app-server native di Codex, `tools.exec.mode: "auto"` viene mappato alle approvazioni riviste da Codex Guardian quando i requisiti locali di Codex lo consentono. OpenClaw di solito invia:

| Campo Codex         | Valore tipico    |
| ------------------- | ---------------- |
| `approvalPolicy`    | `on-request`     |
| `approvalsReviewer` | `auto_review`    |
| `sandbox`           | `workspace-write` |

In modalità `auto`, OpenClaw non preserva override Codex legacy non sicuri come `approvalPolicy: "never"` o `sandbox: "danger-full-access"`. Usa `tools.exec.mode: "full"` solo quando vuoi intenzionalmente la postura senza approvazioni.

Per configurazione app-server, ordine di auth e dettagli del runtime Codex nativo, consulta [harness Codex](/it/plugins/codex-harness).

## Autorizzazioni harness ACPX

Le sessioni ACPX sono non interattive, quindi non possono fare clic su una richiesta di autorizzazione TTY. ACPX usa impostazioni separate a livello di harness sotto `plugins.entries.acpx.config`:

| Impostazione                | Valore comune   | Significato                                  |
| --------------------------- | --------------- | -------------------------------------------- |
| `permissionMode`            | `approve-reads` | Approva automaticamente solo le letture.     |
| `permissionMode`            | `approve-all`   | Approva automaticamente scritture e comandi shell. |
| `permissionMode`            | `deny-all`      | Nega tutte le richieste di autorizzazione.   |
| `nonInteractivePermissions` | `fail`          | Interrompe quando sarebbe richiesta una richiesta. |
| `nonInteractivePermissions` | `deny`          | Nega la richiesta e continua quando possibile. |

Imposta le autorizzazioni ACPX separatamente dalle approvazioni exec di OpenClaw:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
openclaw gateway restart
```

Usa `approve-all` come equivalente ACPX di emergenza di una sessione harness senza richieste. Per i dettagli di configurazione e le modalità di errore, consulta [Configurazione agenti ACP](/it/tools/acp-agents-setup#permission-configuration).

## Scelta di una modalità

| Obiettivo                                     | Configura                                                   |
| --------------------------------------------- | ----------------------------------------------------------- |
| Bloccare completamente i comandi host         | `tools.exec.mode: "deny"`                                   |
| Consentire solo l'esecuzione di comandi noti come sicuri | `tools.exec.mode: "allowlist"`                  |
| Chiedere a una persona per ogni nuova forma di comando | `tools.exec.mode: "ask"`                              |
| Usare l'auto-review Codex/OpenClaw prima delle persone | `tools.exec.mode: "auto"`                            |
| Saltare completamente le approvazioni exec host | `tools.exec.mode: "full"` più file approvazioni host corrispondente |
| Fare scrivere/eseguire le sessioni ACPX non interattive | `plugins.entries.acpx.config.permissionMode: "approve-all"` |

Se un comando mostra ancora una richiesta o fallisce dopo aver cambiato modalità, ispeziona entrambi i livelli:

```bash
openclaw approvals get
openclaw exec-policy show
```

Exec host usa il risultato più restrittivo tra la configurazione OpenClaw e il file delle approvazioni locale all'host. Le autorizzazioni harness ACPX non allentano le approvazioni exec host, e le approvazioni exec host non allentano le richieste harness ACPX.

## Correlati

- [Approvazioni exec](/it/tools/exec-approvals)
- [Approvazioni exec - avanzate](/it/tools/exec-approvals-advanced)
- [harness Codex](/it/plugins/codex-harness)
- [Configurazione agenti ACP](/it/tools/acp-agents-setup#permission-configuration)
