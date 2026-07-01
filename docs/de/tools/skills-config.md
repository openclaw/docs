---
read_when:
    - Konfigurieren des Verhaltens zum Laden, Installieren oder Steuern von Skills
    - Sichtbarkeit von Skills pro Agent festlegen
    - Grenzwerte oder Genehmigungsrichtlinie des Skill Workshop anpassen
sidebarTitle: Skills config
summary: Vollständige Referenz für das Konfigurationsschema `skills.*`, Agent-Allowlists, Workshop-Einstellungen und die Verarbeitung von Sandbox-Umgebungsvariablen.
title: Skills-Konfiguration
x-i18n:
    generated_at: "2026-07-01T05:38:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 37251cd12162c3083b8b9e1a84c462233eb44656a84ca915705859a352c9557b
    source_path: tools/skills-config.md
    workflow: 16
---

Der Großteil der Skills-Konfiguration befindet sich unter `skills` in
`~/.openclaw/openclaw.json`. Agent-spezifische Sichtbarkeit befindet sich unter
`agents.defaults.skills` und `agents.list[].skills`.

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
      watch: true,
      watchDebounceMs: 250,
    },
    install: {
      preferBrew: true,
      nodeManager: "npm",
      allowUploadedArchives: false,
    },
    workshop: {
      autonomous: { enabled: false },
      allowSymlinkTargetWrites: false,
      approvalPolicy: "pending",
      maxPending: 50,
      maxSkillBytes: 40000,
    },
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" },
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

<Note>
  Für die integrierte Bildgenerierung verwenden Sie
  `agents.defaults.imageGenerationModel` zusammen mit dem zentralen Tool
  `image_generate` statt `skills.entries`. Skill-Einträge sind nur für
  benutzerdefinierte oder Drittanbieter-Skill-Workflows vorgesehen.
</Note>

## Laden (`skills.load`)

<ParamField path="skills.load.extraDirs" type="string[]">
  Zusätzliche Skill-Verzeichnisse, die mit der niedrigsten Priorität durchsucht
  werden (nach gebündelten Skills und Plugin-Skills). Pfade werden mit
  Unterstützung für `~` erweitert.
</ParamField>

<ParamField path="skills.load.allowSymlinkTargets" type="string[]">
  Vertrauenswürdige reale Zielverzeichnisse, in die symbolisch verknüpfte
  Skill-Ordner aufgelöst werden dürfen, auch wenn der Symlink außerhalb des
  konfigurierten Stammverzeichnisses liegt. Verwenden Sie dies für bewusst
  angelegte Layouts mit benachbarten Repositorys wie
  `<workspace>/skills/manager -> ~/Projects/manager/skills`. Halten Sie diese
  Liste eng gefasst — verweisen Sie nicht auf breite Stammverzeichnisse wie `~`
  oder `~/Projects`.
</ParamField>

<ParamField path="skills.load.watch" type="boolean" default="true">
  Skill-Ordner überwachen und den Skills-Snapshot aktualisieren, wenn sich
  `SKILL.md`-Dateien ändern. Deckt verschachtelte Dateien unter gruppierten
  Skill-Stammverzeichnissen ab.
</ParamField>

<ParamField path="skills.load.watchDebounceMs" type="number" default="250">
  Debounce-Fenster für Skill-Watcher-Ereignisse in Millisekunden.
</ParamField>

## Installieren (`skills.install`)

<ParamField path="skills.install.preferBrew" type="boolean" default="true">
  Homebrew-Installer bevorzugen, wenn `brew` verfügbar ist.
</ParamField>

<ParamField path="skills.install.nodeManager" type='"npm" | "pnpm" | "yarn" | "bun"' default='"npm"'>
  Bevorzugter Node-Paketmanager für Skill-Installationen. Dies betrifft nur
  Skill-Installationen — die Gateway-Laufzeit sollte weiterhin Node verwenden
  (Bun wird für WhatsApp/Telegram nicht empfohlen). Verwenden Sie
  `openclaw setup --node-manager` für npm, pnpm oder bun; setzen Sie `"yarn"`
  manuell für Yarn-gestützte Skill-Installationen.
</ParamField>

<ParamField path="skills.install.allowUploadedArchives" type="boolean" default="false">
  Vertrauenswürdigen `operator.admin`-Gateway-Clients erlauben, private
  Zip-Archive zu installieren, die über `skills.upload.*` bereitgestellt wurden.
  Normale ClawHub-Installationen benötigen diese Einstellung nicht.
</ParamField>

## Operator-Installationsrichtlinie (`security.installPolicy`)

Verwenden Sie `security.installPolicy`, wenn Operatoren einen vertrauenswürdigen
lokalen Befehl benötigen, um Skill- und Plugin-Installationen mit hostspezifischer
Richtlinie zu genehmigen oder zu blockieren. Die Richtlinie wird ausgeführt,
nachdem OpenClaw Quellmaterial bereitgestellt hat und bevor die Installation
oder Aktualisierung fortgesetzt wird. Sie gilt für ClawHub-Skills,
hochgeladene Skills, Git-/lokale Skills, Skill-Abhängigkeitsinstaller sowie
Quellen für Plugin-Installationen und -Aktualisierungen.

```json5
{
  security: {
    installPolicy: {
      enabled: true,
      // Omit targets to cover every supported target.
      targets: ["skill", "plugin"],
      exec: {
        source: "exec",
        command: "/usr/local/bin/openclaw-install-policy",
        args: ["--json"],
        timeoutMs: 10000,
        noOutputTimeoutMs: 10000,
        maxOutputBytes: 1048576,
        passEnv: ["OPENCLAW_STATE_DIR", "PATH"],
        env: { POLICY_MODE: "strict" },
        trustedDirs: ["/usr/local/bin"],
      },
    },
  },
}
```

<ParamField path="security.installPolicy.enabled" type="boolean" default="false">
  Aktiviert die vom Operator verwaltete Installationsrichtlinie. Wenn sie ohne
  gültigen `exec`-Befehl aktiviert ist, schlagen Installationen geschlossen fehl.
</ParamField>

<ParamField path="security.installPolicy.targets" type='("skill" | "plugin")[]'>
  Optionaler Zielfilter. Wenn ausgelassen, gilt die Richtlinie für jedes
  unterstützte Ziel, damit neue Installationen nicht unerwartet offen
  fehlschlagen.
</ParamField>

<ParamField path="security.installPolicy.exec.command" type="string">
  Absoluter Pfad zur vertrauenswürdigen ausführbaren Richtliniendatei. OpenClaw
  führt sie ohne Shell aus und validiert den Pfad vor der Verwendung.
</ParamField>

<ParamField path="security.installPolicy.exec.args" type="string[]">
  Statische Argumente, die nach `command` übergeben werden.
</ParamField>

<ParamField path="security.installPolicy.exec.timeoutMs" type="number" default="10000">
  Maximale Wanduhr-Laufzeit für eine Richtlinienentscheidung.
</ParamField>

<ParamField path="security.installPolicy.exec.noOutputTimeoutMs" type="number" default="timeoutMs">
  Maximale Zeit ohne stdout- oder stderr-Ausgabe, bevor die Richtlinie
  geschlossen fehlschlägt.
</ParamField>

<ParamField path="security.installPolicy.exec.maxOutputBytes" type="number" default="1048576">
  Maximal akzeptierte kombinierte stdout- und stderr-Bytes vom
  Richtlinienprozess.
</ParamField>

<ParamField path="security.installPolicy.exec.env" type="Record<string, string>">
  Literale Umgebungsvariablen, die dem Richtlinienprozess bereitgestellt werden.
</ParamField>

<ParamField path="security.installPolicy.exec.passEnv" type="string[]">
  Namen von Umgebungsvariablen, die aus dem OpenClaw-Prozess in den
  Richtlinienprozess kopiert werden. Nur benannte Variablen werden übergeben.
</ParamField>

<ParamField path="security.installPolicy.exec.trustedDirs" type="string[]">
  Optionale Zulassungsliste von Verzeichnissen, die die ausführbare
  Richtliniendatei enthalten dürfen.
</ParamField>

<ParamField path="security.installPolicy.exec.allowInsecurePath" type="boolean" default="false">
  Umgeht Prüfungen von Eigentümerschaft und Berechtigungen des Befehlspfads.
  Nur verwenden, wenn der Pfad durch einen anderen Mechanismus geschützt ist.
</ParamField>

<ParamField path="security.installPolicy.exec.allowSymlinkCommand" type="boolean" default="false">
  Erlaubt, dass der konfigurierte Befehlspfad ein Symlink ist. Das aufgelöste
  Ziel muss weiterhin die anderen Pfadprüfungen erfüllen. Argumente für
  Interpreter-Skripte müssen direkte reguläre Dateien sein, keine Symlinks.
</ParamField>

Die Richtlinie erhält ein JSON-Objekt auf stdin mit `protocolVersion: 1`,
`openclawVersion`, `targetType`, `targetName`, `sourcePath`, `sourcePathKind`,
optionalem strukturiertem `source`, strukturiertem `origin` und `request`. Sie
muss ein JSON-Objekt auf stdout schreiben: `{ "protocolVersion": 1, "decision": "allow" }`
oder `{ "protocolVersion": 1, "decision": "block", "reason": "..." }`.
Exit ungleich null, Timeout, fehlerhaftes JSON, fehlende Felder oder nicht
unterstützte Protokollversionen schlagen geschlossen fehl.

OpenClaw führt die Installationsrichtlinie beim normalen Gateway-Start nicht
aus. Installationen und Aktualisierungen schlagen geschlossen fehl, wenn die
Richtlinie aktiviert, aber nicht verfügbar ist. `openclaw doctor` führt eine
statische Validierung durch, und `openclaw doctor --deep` führt eine synthetische
Installationsprüfung gegen den konfigurierten Befehl aus.

Massenaktualisierungen wenden die Richtlinie pro Ziel an: Eine blockierte
Skill- oder Plugin-Aktualisierung schlägt für dieses Ziel fehl, ohne die
Richtlinie zu deaktivieren oder spätere Ziele im Batch zu überspringen.

Beispiel für stdin:

```json
{
  "protocolVersion": 1,
  "openclawVersion": "2026.6.1",
  "targetType": "skill",
  "targetName": "weather",
  "sourcePath": "/var/folders/.../openclaw-skill-clawhub/root",
  "sourcePathKind": "directory",
  "source": {
    "kind": "clawhub",
    "authority": "openclaw",
    "mutable": false,
    "network": true
  },
  "origin": {
    "type": "clawhub",
    "registry": "https://clawhub.openclaw.ai",
    "slug": "weather",
    "version": "1.0.0"
  },
  "request": {
    "kind": "skill-install",
    "mode": "install",
    "requestedSpecifier": "clawhub:weather@1.0.0"
  },
  "skill": {
    "installId": "clawhub"
  }
}
```

Minimaler Richtlinienbefehl:

```js
#!/usr/bin/env node

let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  input += chunk;
});
process.stdin.on("end", () => {
  const request = JSON.parse(input);
  if (request.targetType === "plugin" && request.source?.kind === "local-path") {
    process.stdout.write(
      JSON.stringify({
        protocolVersion: 1,
        decision: "block",
        reason: "local plugin paths are not approved on this host",
      }),
    );
    return;
  }
  process.stdout.write(JSON.stringify({ protocolVersion: 1, decision: "allow" }));
});
```

## Zulassungsliste für gebündelte Skills

<ParamField path="skills.allowBundled" type="string[]">
  Optionale Zulassungsliste nur für **gebündelte** Skills. Wenn gesetzt, sind
  nur gebündelte Skills in der Liste zulässig. Verwaltete Skills,
  agentenbezogene Skills und Workspace-Skills bleiben unberührt.
</ParamField>

## Einträge pro Skill (`skills.entries`)

Schlüssel unter `entries` entsprechen standardmäßig dem Skill-`name`. Wenn ein
Skill `metadata.openclaw.skillKey` definiert, verwenden Sie stattdessen diesen
Schlüssel. Setzen Sie Namen mit Bindestrich in Anführungszeichen (JSON5 erlaubt
Schlüssel in Anführungszeichen).

<ParamField path="skills.entries.<key>.enabled" type="boolean">
  `false` deaktiviert den Skill, selbst wenn er gebündelt oder installiert ist.
  Der gebündelte Skill `coding-agent` ist Opt-in — setzen Sie ihn auf `true` und
  stellen Sie sicher, dass `claude`, `codex`, `opencode` oder eine andere
  unterstützte CLI installiert und authentifiziert ist.
</ParamField>

<ParamField path="skills.entries.<key>.apiKey" type='string | { source, provider, id }'>
  Komfortfeld für Skills, die `metadata.openclaw.primaryEnv` deklarieren.
  Unterstützt eine Klartextzeichenfolge oder eine SecretRef:
  `{ source: "env", provider: "default", id: "VAR_NAME" }`.
</ParamField>

<ParamField path="skills.entries.<key>.env" type="Record<string, string>">
  Umgebungsvariablen, die für den Agentenlauf injiziert werden. Nur injiziert,
  wenn die Variable im Prozess noch nicht gesetzt ist.
</ParamField>

<ParamField path="skills.entries.<key>.config" type="object">
  Optionale Sammlung für benutzerdefinierte Konfigurationsfelder pro Skill.
</ParamField>

## Agent-Zulassungslisten (`agents`)

Verwenden Sie die Agentenkonfiguration, wenn Sie dieselben
Skill-Stammverzeichnisse für Maschine/Workspace, aber pro Agent einen anderen
sichtbaren Skill-Satz verwenden möchten.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"], // shared baseline
    },
    list: [
      { id: "writer" }, // inherits github, weather
      { id: "docs", skills: ["docs-search"] }, // replaces defaults entirely
      { id: "locked-down", skills: [] }, // no skills
    ],
  },
}
```

<ParamField path="agents.defaults.skills" type="string[]">
  Gemeinsame Basis-Zulassungsliste, die von Agenten geerbt wird, die
  `agents.list[].skills` auslassen. Ganz auslassen, damit Skills standardmäßig
  nicht eingeschränkt werden.
</ParamField>

<ParamField path="agents.list[].skills" type="string[]">
  Expliziter endgültiger Skill-Satz für diesen Agenten. Explizite Listen
  **ersetzen** geerbte Standardwerte — sie werden nicht zusammengeführt. Auf
  `[]` setzen, um für diesen Agenten keine Skills verfügbar zu machen.
</ParamField>

<Warning>
  Agent-Skill-Zulassungslisten sind ein Sichtbarkeits- und Ladefilter für die
  Skill-Erkennung von OpenClaw, Prompts, Slash-Command-Erkennung,
  Sandbox-Synchronisierung und Skill-Snapshots. Sie sind keine
  Autorisierungsgrenze zur Shell-Laufzeit. Wenn ein Agent Host-`exec` ausführen
  kann, kann diese Shell weiterhin externe Clients ausführen oder Host-Dateien
  lesen, die für den ausführenden Benutzer sichtbar sind, einschließlich
  MCP-Client-Registrierungen wie `~/.openclaw/skills/config/mcporter.json`.
  Für MCP-Isolation pro Agent kombinieren Sie Skill-Zulassungslisten mit
  Sandbox-/OS-Benutzer-Isolation, verweigern oder beschränken Sie Host-Exec
  streng per Zulassungsliste und bevorzugen Sie agentenspezifische Anmeldedaten
  am MCP-Server.
</Warning>

## Workshop (`skills.workshop`)

<ParamField path="skills.workshop.autonomous.enabled" type="boolean" default="false">
  Wenn `true`, können Agenten nach erfolgreichen Durchläufen aus dauerhaften
  Gesprächssignalen ausstehende Vorschläge erstellen. Vom Benutzer ausgelöste
  Skill-Erstellung läuft unabhängig von dieser Einstellung immer über Skill
  Workshop.
</ParamField>

<ParamField path="skills.workshop.approvalPolicy" type='"pending" | "auto"' default='"pending"'>
  `pending` erfordert die Genehmigung durch eine Bedienperson, bevor ein vom Agent initiiertes Anwenden, Ablehnen oder
  Quarantänisieren erfolgt. `auto` erlaubt diese Aktionen ohne Genehmigung.
</ParamField>

<ParamField path="skills.workshop.allowSymlinkTargetWrites" type="boolean" default="false">
  Erlauben Sie Skill Workshop Apply, über Workspace-Skill-Symlinks zu schreiben, deren
  echtes Ziel bereits durch `skills.load.allowSymlinkTargets` als vertrauenswürdig eingestuft ist. Lassen Sie dies
  deaktiviert, außer angewendete generierte Vorschläge sollen diesen gemeinsamen Skill-
  Root verändern.
</ParamField>

<ParamField path="skills.workshop.maxPending" type="number" default="50">
  Maximale Anzahl ausstehender und quarantänisierter Vorschläge, die pro Workspace aufbewahrt werden.
</ParamField>

<ParamField path="skills.workshop.maxSkillBytes" type="number" default="40000">
  Maximale Größe des Vorschlagstexts in Byte. Vorschlagsbeschreibungen sind hart auf
  160 Byte begrenzt, da sie in Discovery- und Listen-Ausgaben erscheinen.
</ParamField>

## Symlink-verknüpfte Skill-Roots

Standardmäßig sind Workspace-, Projekt-Agent-, Extra-Verzeichnis- und gebündelte Skill-Roots
Einschlussgrenzen. Ein per Symlink verknüpfter Skill-Ordner unter `<workspace>/skills`,
der außerhalb des Roots aufgelöst wird, wird mit einer Logmeldung übersprungen.

Um ein beabsichtigtes Symlink-Layout zu erlauben, deklarieren Sie das vertrauenswürdige Ziel:

```json5
{
  skills: {
    load: {
      extraDirs: ["~/Projects/manager/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
    },
  },
}
```

Mit dieser Konfiguration wird `<workspace>/skills/manager -> ~/Projects/manager/skills` nach
der Realpath-Auflösung akzeptiert. `extraDirs` scannt das benachbarte Repo direkt;
`allowSymlinkTargets` behält den Symlink-Pfad für bestehende Layouts bei.

Skill Workshop Apply schreibt standardmäßig nicht über diese Symlinks. Damit
Workshop Apply Skills unter bereits vertrauenswürdigen Symlink-Zielen verändern darf, aktivieren Sie dies
separat:

```json5
{
  skills: {
    load: {
      allowSymlinkTargets: ["~/Projects/manager/skills"],
    },
    workshop: {
      allowSymlinkTargetWrites: true,
    },
  },
}
```

Verwaltete Verzeichnisse `~/.openclaw/skills` und persönliche Verzeichnisse `~/.agents/skills`
akzeptieren bereits Skill-Verzeichnis-Symlinks (die Einschlussregel pro Skill-`SKILL.md`
gilt weiterhin).

## Sandboxed Skills und Umgebungsvariablen

<Warning>
  `skills.entries.<skill>.env` und `apiKey` gelten nur für **Host**-Ausführungen. Innerhalb
  einer Sandbox haben sie keine Wirkung — ein Skill, der von `GEMINI_API_KEY` abhängt, schlägt
  mit `apiKey not configured` fehl, sofern der Sandbox die Variable nicht
  separat übergeben wird.
</Warning>

Übergeben Sie Secrets mit Folgendem an eine Docker-Sandbox:

```json5
{
  agents: {
    defaults: {
      sandbox: {
        docker: {
          env: { GEMINI_API_KEY: "your-key-here" },
        },
      },
    },
  },
}
```

<Note>
  Benutzer mit Zugriff auf den Docker-Daemon können `sandbox.docker.env`-Werte
  über Docker-Metadaten einsehen. Verwenden Sie eine eingehängte Secret-Datei, ein benutzerdefiniertes Image oder
  einen anderen Bereitstellungspfad, wenn diese Offenlegung nicht akzeptabel ist.
</Note>

## Hinweis zur Ladereihenfolge

```text
workspace/skills      (highest)
workspace/.agents/skills
~/.agents/skills
~/.openclaw/skills
bundled skills
skills.load.extraDirs (lowest)
```

Änderungen an Skills und Konfiguration werden in der nächsten neuen Sitzung wirksam, wenn der
Watcher aktiviert ist, oder im nächsten Agent-Turn, wenn der Watcher eine Änderung erkennt.

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Skills-Referenz" href="/de/tools/skills" icon="puzzle-piece">
    Was Skills sind, Ladereihenfolge, Gating und das Format von SKILL.md.
  </Card>
  <Card title="Skills erstellen" href="/de/tools/creating-skills" icon="hammer">
    Benutzerdefinierte Workspace-Skills erstellen.
  </Card>
  <Card title="Skill Workshop" href="/de/tools/skill-workshop" icon="flask">
    Vorschlagswarteschlange für vom Agent entworfene Skills.
  </Card>
  <Card title="Slash-Befehle" href="/de/tools/slash-commands" icon="terminal">
    Nativer Slash-Befehlskatalog und Chat-Direktiven.
  </Card>
</CardGroup>
