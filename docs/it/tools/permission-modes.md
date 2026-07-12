---
read_when:
    - Scelta tra auto, ask, allowlist, full o deny per le autorizzazioni dei comandi
    - Configurazione delle approvazioni revisionate da Codex Guardian tramite tools.exec.mode
    - Confronto tra le approvazioni exec di OpenClaw e i permessi dell'harness ACPX
summary: Modalità di autorizzazione per l'esecuzione sull'host, approvazioni di Codex Guardian e sessioni dell'harness ACPX
title: Modalità di autorizzazione
x-i18n:
    generated_at: "2026-07-12T07:34:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f580e66508c1f69e868ed26a62d88a675f86a4d1ca738650dc5af82e967f3ac3
    source_path: tools/permission-modes.md
    workflow: 16
---

Le modalità di autorizzazione determinano il livello di autorità di un agente prima che esegua comandi sull'host, scriva file o richieda a un harness di backend un accesso aggiuntivo.

<Note>
  La modalità di autorizzazione è distinta da `tools.exec.host=auto`. `tools.exec.host`
  sceglie dove viene eseguito un comando. `tools.exec.mode` sceglie come viene
  approvata l'esecuzione sull'host.
</Note>

## Impostazione predefinita consigliata

Usa `auto` per gli agenti di programmazione che necessitano di un accesso utile all'host senza trasformare ogni mancata corrispondenza in una richiesta a una persona:

```bash
openclaw config set tools.exec.mode auto
openclaw approvals get
openclaw gateway restart
```

Quindi verifica il criterio effettivo:

```bash
openclaw exec-policy show
```

## Modalità di esecuzione sull'host di OpenClaw

`tools.exec.mode` è la superficie normalizzata dei criteri per `exec` sull'host. Ogni modalità viene risolta in una coppia sottostante composta da `security` (rigidità dell'elenco consentito) e `ask` (richiesta in caso di mancata corrispondenza):

| Modalità    | security / ask          | Comportamento                                                                                                             | Da usare quando                                                       |
| ----------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `deny`      | `deny` / `off`          | Blocca completamente l'esecuzione sull'host.                                                                              | Non è consentito alcun comando sull'host.                             |
| `allowlist` | `allowlist` / `off`     | Esegue solo i comandi presenti nell'elenco consentito; nega silenziosamente le mancate corrispondenze.                    | Disponi di un insieme di comandi di cui è nota la sicurezza.          |
| `ask`       | `allowlist` / `on-miss` | Esegue le corrispondenze con l'elenco consentito; chiede a una persona in caso di mancata corrispondenza.                  | Una persona deve esaminare ogni nuovo comando.                        |
| `auto`      | `allowlist` / `on-miss` | Esegue le corrispondenze con l'elenco consentito; sottopone le altre alla revisione automatica prima dell'approvazione umana. | Le sessioni di programmazione richiedono un accesso pratico e protetto. |
| `full`      | `full` / `off`          | Esegue i comandi sull'host senza richieste.                                                                                | L'host o la sessione è attendibile e deve ignorare i controlli di approvazione. |

`ask` e `auto` condividono le stesse impostazioni di elenco consentito e richiesta; `auto` abilita inoltre il revisore automatico nativo, che decide autonomamente sulle mancate corrispondenze e ricorre al percorso configurato di approvazione umana solo quando non può approvarle in sicurezza.

Per il criterio completo di esecuzione sull'host, il file locale delle approvazioni, lo schema dell'elenco consentito, i binari sicuri e il comportamento di inoltro, consulta [Approvazioni dell'esecuzione](/it/tools/exec-approvals).

## Mappatura di Codex Guardian

Per le sessioni native del server applicativo Codex, `tools.exec.mode: "auto"` indirizza Codex verso approvazioni esaminate da Guardian quando i requisiti locali di Codex lo consentono. Valori tipici risultanti:

| Campo Codex         | Valore tipico     |
| ------------------- | ----------------- |
| `approvalPolicy`    | `on-request`      |
| `approvalsReviewer` | `auto_review`     |
| `sandbox`           | `workspace-write` |

La modalità `auto` impone questo criterio rispetto a qualsiasi sostituzione configurata della sandbox o delle approvazioni di Codex, quindi non conserva combinazioni obsolete e non sicure come `approvalPolicy: "never"` con `sandbox: "danger-full-access"`. `tools.exec.mode: "deny"` e `"allowlist"` bloccano completamente l'esecuzione locale del server applicativo Codex. Usa `tools.exec.mode: "full"` solo quando desideri intenzionalmente una configurazione senza approvazioni.

Per la configurazione del server applicativo, l'ordine di autenticazione e i dettagli del runtime nativo di Codex, consulta [Harness Codex](/it/plugins/codex-harness).

## Autorizzazioni dell'harness ACPX

Le sessioni ACPX non sono interattive, quindi non possono selezionare una richiesta di autorizzazione nella TTY. ACPX utilizza impostazioni separate a livello di harness in `plugins.entries.acpx.config`:

| Impostazione               | Valori          | Significato                                                     |
| -------------------------- | --------------- | --------------------------------------------------------------- |
| `permissionMode`           | `approve-reads` | Approva automaticamente solo le letture.                        |
| `permissionMode`           | `approve-all`   | Approva automaticamente le scritture e i comandi della shell.   |
| `permissionMode`           | `deny-all`      | Nega tutte le richieste di autorizzazione.                       |
| `nonInteractivePermissions` | `fail`         | Interrompe l'esecuzione quando sarebbe necessaria una richiesta. |
| `nonInteractivePermissions` | `deny`         | Nega la richiesta e prosegue quando possibile.                   |

Imposta le autorizzazioni ACPX separatamente dalle approvazioni di esecuzione di OpenClaw:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
openclaw gateway restart
```

Usa `approve-all` come equivalente ACPX di emergenza per una sessione dell'harness senza richieste. Per i dettagli di configurazione e le modalità di errore, consulta [Configurazione degli agenti ACP](/it/tools/acp-agents-setup#permission-configuration).

## Scelta di una modalità

| Obiettivo                                                | Configurazione                                               |
| -------------------------------------------------------- | ------------------------------------------------------------ |
| Bloccare completamente i comandi sull'host               | `tools.exec.mode: "deny"`                                    |
| Consentire solo l'esecuzione di comandi di sicurezza nota | `tools.exec.mode: "allowlist"`                               |
| Chiedere a una persona per ogni nuovo tipo di comando    | `tools.exec.mode: "ask"`                                     |
| Usare la revisione automatica di Codex/OpenClaw prima di ricorrere alle persone | `tools.exec.mode: "auto"`                    |
| Ignorare completamente le approvazioni di esecuzione sull'host | `tools.exec.mode: "full"` più il file corrispondente delle approvazioni dell'host |
| Consentire scrittura/esecuzione nelle sessioni ACPX non interattive | `plugins.entries.acpx.config.permissionMode: "approve-all"` |

Se un comando continua a mostrare una richiesta o non riesce dopo aver cambiato modalità, esamina entrambi i livelli:

```bash
openclaw approvals get
openclaw exec-policy show
```

L'esecuzione sull'host utilizza il risultato più restrittivo tra la configurazione di OpenClaw e il file delle approvazioni locale dell'host. Le autorizzazioni dell'harness ACPX non rendono meno restrittive le approvazioni di esecuzione sull'host, e queste ultime non rendono meno restrittive le richieste dell'harness ACPX.

## Argomenti correlati

- [Approvazioni dell'esecuzione](/it/tools/exec-approvals)
- [Approvazioni dell'esecuzione - configurazione avanzata](/it/tools/exec-approvals-advanced)
- [Harness Codex](/it/plugins/codex-harness)
- [Configurazione degli agenti ACP](/it/tools/acp-agents-setup#permission-configuration)
