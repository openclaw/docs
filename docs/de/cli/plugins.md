---
read_when:
    - Sie möchten Gateway-Plugins oder kompatible Bundles installieren oder verwalten
    - Sie möchten Plugin-Ladefehler debuggen
sidebarTitle: Plugins
summary: CLI-Referenz für `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugins
x-i18n:
    generated_at: "2026-05-02T22:17:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3b077ab0739e2453ccba434aa3b02b1d441bab792b7b131216221a8048d551cd
    source_path: cli/plugins.md
    workflow: 16
---

Gateway-Plugins, Hook-Packs und kompatible Bundles verwalten.

<CardGroup cols={2}>
  <Card title="Plugin-System" href="/de/tools/plugin">
    Leitfaden für Endbenutzer zum Installieren, Aktivieren und Beheben von Problemen mit Plugins.
  </Card>
  <Card title="Plugins verwalten" href="/de/plugins/manage-plugins">
    Kurze Beispiele für Installation, Auflistung, Aktualisierung, Deinstallation und Veröffentlichung.
  </Card>
  <Card title="Plugin-Bundles" href="/de/plugins/bundles">
    Kompatibilitätsmodell für Bundles.
  </Card>
  <Card title="Plugin-Manifest" href="/de/plugins/manifest">
    Manifestfelder und Konfigurationsschema.
  </Card>
  <Card title="Sicherheit" href="/de/gateway/security">
    Sicherheitshärtung für Plugin-Installationen.
  </Card>
</CardGroup>

## Befehle

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins search <query>
openclaw plugins search <query> --limit 20
openclaw plugins search <query> --json
openclaw plugins install <path-or-spec>
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
openclaw plugins inspect --all
openclaw plugins info <id>
openclaw plugins enable <id>
openclaw plugins disable <id>
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins uninstall <id>
openclaw plugins doctor
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins marketplace list <marketplace>
openclaw plugins marketplace list <marketplace> --json
```

Für Untersuchungen zu langsamen Installations-, Inspect-, Deinstallations- oder Registry-Aktualisierungsvorgängen führen Sie den Befehl mit `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` aus. Der Trace schreibt Phasen-Timings nach stderr und hält die JSON-Ausgabe parsebar. Siehe [Debugging](/de/help/debugging#plugin-lifecycle-trace).

<Note>
Gebündelte Plugins werden mit OpenClaw ausgeliefert. Einige sind standardmäßig aktiviert (zum Beispiel gebündelte Modell-Provider, gebündelte Sprach-Provider und das gebündelte Browser-Plugin); andere erfordern `plugins enable`.

Native OpenClaw-Plugins müssen `openclaw.plugin.json` mit einem inline JSON Schema (`configSchema`, auch wenn leer) ausliefern. Kompatible Bundles verwenden stattdessen ihre eigenen Bundle-Manifeste.

`plugins list` zeigt `Format: openclaw` oder `Format: bundle`. Ausführliche Listen-/Info-Ausgaben zeigen außerdem den Bundle-Untertyp (`codex`, `claude` oder `cursor`) sowie erkannte Bundle-Funktionen.
</Note>

### Installieren

```bash
openclaw plugins search "calendar"                   # search ClawHub plugins
openclaw plugins install <package>                      # npm by default
openclaw plugins install clawhub:<package>              # ClawHub only
openclaw plugins install npm:<package>                  # npm only
openclaw plugins install git:github.com/<owner>/<repo>  # git repo
openclaw plugins install git:github.com/<owner>/<repo>@<ref>
openclaw plugins install <package> --force              # overwrite existing install
openclaw plugins install <package> --pin                # pin version
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # local path
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (explicit)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

<Warning>
Reine Paketnamen installieren während der Launch-Umstellung standardmäßig aus npm. Verwenden Sie `clawhub:<package>` für ClawHub. Behandeln Sie Plugin-Installationen wie das Ausführen von Code. Bevorzugen Sie gepinnte Versionen.
</Warning>

`plugins search` fragt ClawHub nach installierbaren Plugin-Paketen ab und gibt installierbare Paketnamen aus. Es durchsucht Code-Plugin- und Bundle-Plugin-Pakete, nicht Skills. Verwenden Sie `openclaw skills search` für ClawHub-Skills.

<Note>
ClawHub ist die primäre Distributions- und Discovery-Oberfläche für die meisten Plugins. Npm bleibt ein unterstützter Fallback und direkter Installationspfad. OpenClaw-eigene `@openclaw/*`-Plugin-Pakete werden wieder auf npm veröffentlicht; die aktuelle Liste finden Sie auf [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) oder im [Plugin-Inventar](/de/plugins/plugin-inventory). Stabile Installationen verwenden `latest`. Installationen und Aktualisierungen im Beta-Kanal bevorzugen den npm-`beta`-Dist-Tag, wenn dieser Tag verfügbar ist, und fallen dann auf `latest` zurück.
</Note>

<AccordionGroup>
  <Accordion title="Config-Includes und Wiederherstellung bei ungültiger Konfiguration">
    Wenn Ihr Abschnitt `plugins` durch ein einteiliges `$include` gestützt wird, schreiben `plugins install/update/enable/disable/uninstall` in diese eingebundene Datei durch und lassen `openclaw.json` unverändert. Root-Includes, Include-Arrays und Includes mit benachbarten Overrides schlagen geschlossen fehl, statt abgeflacht zu werden. Siehe [Config-Includes](/de/gateway/configuration) für die unterstützten Formen.

    Wenn die Konfiguration während der Installation ungültig ist, schlägt `plugins install` normalerweise geschlossen fehl und weist Sie an, zuerst `openclaw doctor --fix` auszuführen. Während des Gateway-Starts wird ungültige Konfiguration für ein Plugin auf dieses Plugin isoliert, sodass andere Kanäle und Plugins weiterlaufen können; `openclaw doctor --fix` kann den ungültigen Plugin-Eintrag quarantänisieren. Die einzige dokumentierte Ausnahme zur Installationszeit ist ein enger Wiederherstellungspfad für gebündelte Plugins, die sich ausdrücklich für `openclaw.install.allowInvalidConfigRecovery` entscheiden.

  </Accordion>
  <Accordion title="--force und Neuinstallation gegenüber Aktualisierung">
    `--force` verwendet das bestehende Installationsziel erneut und überschreibt ein bereits installiertes Plugin oder Hook-Pack an Ort und Stelle. Verwenden Sie es, wenn Sie absichtlich dieselbe ID aus einem neuen lokalen Pfad, Archiv, ClawHub-Paket oder npm-Artefakt neu installieren. Für routinemäßige Upgrades eines bereits nachverfolgten npm-Plugins bevorzugen Sie `openclaw plugins update <id-or-npm-spec>`.

    Wenn Sie `plugins install` für eine bereits installierte Plugin-ID ausführen, stoppt OpenClaw und verweist Sie für ein normales Upgrade auf `plugins update <id-or-npm-spec>` oder auf `plugins install <package> --force`, wenn Sie die aktuelle Installation tatsächlich aus einer anderen Quelle überschreiben möchten.

  </Accordion>
  <Accordion title="Gültigkeitsbereich von --pin">
    `--pin` gilt nur für npm-Installationen. Es wird nicht mit `git:`-Installationen unterstützt; verwenden Sie eine explizite Git-Referenz wie `git:github.com/acme/plugin@v1.2.3`, wenn Sie eine gepinnte Quelle möchten. Es wird nicht mit `--marketplace` unterstützt, weil Marketplace-Installationen Marketplace-Quellmetadaten statt einer npm-Spezifikation dauerhaft speichern.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` ist eine Break-Glass-Option für False Positives im eingebauten Scanner für gefährlichen Code. Sie lässt die Installation fortfahren, selbst wenn der eingebaute Scanner `critical`-Befunde meldet, umgeht aber **nicht** Policy-Blockaden durch Plugin-`before_install`-Hooks und umgeht **nicht** Scan-Fehler.

    Dieses CLI-Flag gilt für Plugin-Installations-/Aktualisierungsabläufe. Gateway-gestützte Installationen von Skill-Abhängigkeiten verwenden den passenden Request-Override `dangerouslyForceUnsafeInstall`, während `openclaw skills install` ein separater ClawHub-Skill-Download-/Installationsablauf bleibt.

    Wenn ein von Ihnen auf ClawHub veröffentlichtes Plugin durch einen Registry-Scan blockiert wird, verwenden Sie die Publisher-Schritte in [ClawHub](/de/tools/clawhub).

  </Accordion>
  <Accordion title="Hook-Packs und npm-Spezifikationen">
    `plugins install` ist auch die Installationsoberfläche für Hook-Packs, die `openclaw.hooks` in `package.json` bereitstellen. Verwenden Sie `openclaw hooks` für gefilterte Hook-Sichtbarkeit und Aktivierung einzelner Hooks, nicht für die Paketinstallation.

    Npm-Spezifikationen sind **nur Registry** (Paketname plus optionale **exakte Version** oder **Dist-Tag**). Git-/URL-/Dateispezifikationen und Semver-Bereiche werden abgelehnt. Abhängigkeitsinstallationen laufen aus Sicherheitsgründen projektlokal mit `--ignore-scripts`, auch wenn Ihre Shell globale npm-Installationseinstellungen hat.

    Verwenden Sie `npm:<package>`, wenn Sie die npm-Auflösung explizit machen möchten. Reine Paketspezifikationen installieren während der Launch-Umstellung ebenfalls direkt aus npm.

    Reine Spezifikationen und `@latest` bleiben auf dem stabilen Track. Wenn npm eine davon zu einer Vorabversion auflöst, stoppt OpenClaw und fordert Sie auf, sich explizit mit einem Vorabversions-Tag wie `@beta`/`@rc` oder einer exakten Vorabversion wie `@1.2.3-beta.4` dafür zu entscheiden.

    Wenn eine reine Installationsspezifikation mit einer offiziellen Plugin-ID übereinstimmt (zum Beispiel `diffs`), installiert OpenClaw den Katalogeintrag direkt. Um ein npm-Paket mit demselben Namen zu installieren, verwenden Sie eine explizite scoped Spezifikation (zum Beispiel `@scope/diffs`).

  </Accordion>
  <Accordion title="Git-Repositorys">
    Verwenden Sie `git:<repo>`, um direkt aus einem Git-Repository zu installieren. Unterstützte Formen umfassen `git:github.com/owner/repo`, `git:owner/repo`, vollständige `https://`-, `ssh://`-, `git://`-, `file://`- und `git@host:owner/repo.git`-Clone-URLs. Fügen Sie `@<ref>` oder `#<ref>` hinzu, um vor der Installation einen Branch, Tag oder Commit auszuchecken.

    Git-Installationen klonen in ein temporäres Verzeichnis, checken die angeforderte Referenz aus, falls vorhanden, und verwenden dann den normalen Installer für Plugin-Verzeichnisse. Das bedeutet, dass Manifestvalidierung, Scans auf gefährlichen Code, Installationsarbeit des Paketmanagers und Installationsdatensätze sich wie bei npm-Installationen verhalten. Aufgezeichnete Git-Installationen enthalten die Quell-URL/-Referenz sowie den aufgelösten Commit, damit `openclaw plugins update` die Quelle später erneut auflösen kann.

    Nach der Installation aus Git verwenden Sie `openclaw plugins inspect <id> --runtime --json`, um Laufzeitregistrierungen wie Gateway-Methoden und CLI-Befehle zu überprüfen. Wenn das Plugin mit `api.registerCli` einen CLI-Root registriert hat, führen Sie diesen Befehl direkt über die OpenClaw-Root-CLI aus, zum Beispiel `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archive">
    Unterstützte Archive: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Native OpenClaw-Plugin-Archive müssen ein gültiges `openclaw.plugin.json` im extrahierten Plugin-Root enthalten; Archive, die nur `package.json` enthalten, werden abgelehnt, bevor OpenClaw Installationsdatensätze schreibt.

    Claude-Marketplace-Installationen werden ebenfalls unterstützt.

  </Accordion>
</AccordionGroup>

ClawHub-Installationen verwenden einen expliziten `clawhub:<package>`-Locator:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Reine npm-sichere Plugin-Spezifikationen installieren während der Launch-Umstellung standardmäßig aus npm:

```bash
openclaw plugins install openclaw-codex-app-server
```

Verwenden Sie `npm:`, um die reine npm-Auflösung explizit zu machen:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw prüft vor der Installation die beworbene Plugin-API- / Mindest-Gateway-Kompatibilität. Wenn die ausgewählte ClawHub-Version ein ClawPack-Artefakt veröffentlicht, lädt OpenClaw das versionierte npm-pack-`.tgz` herunter, verifiziert den ClawHub-Digest-Header und den Artefakt-Digest und installiert es dann über den normalen Archivpfad. Ältere ClawHub-Versionen ohne ClawPack-Metadaten installieren weiterhin über den Legacy-Paketarchiv-Verifizierungspfad. Aufgezeichnete Installationen behalten ihre ClawHub-Quellmetadaten, Artefaktart, npm-Integrität, npm-Shasum, Tarball-Namen und ClawPack-Digest-Fakten für spätere Aktualisierungen.
Unversionierte ClawHub-Installationen behalten eine unversionierte aufgezeichnete Spezifikation, damit `openclaw plugins update` neueren ClawHub-Releases folgen kann; explizite Versions- oder Tag-Selektoren wie `clawhub:pkg@1.2.3` und `clawhub:pkg@beta` bleiben an diesen Selektor gepinnt.

#### Marketplace-Kurzform

Verwenden Sie die Kurzform `plugin@marketplace`, wenn der Marketplace-Name in Claudes lokalem Registry-Cache unter `~/.claude/plugins/known_marketplaces.json` vorhanden ist:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

Verwenden Sie `--marketplace`, wenn Sie die Marketplace-Quelle explizit übergeben möchten:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="Marketplace sources">
    - ein Claude bekannter Marketplace-Name aus `~/.claude/plugins/known_marketplaces.json`
    - ein lokaler Marketplace-Stammordner oder `marketplace.json`-Pfad
    - eine GitHub-Repo-Kurzform wie `owner/repo`
    - eine GitHub-Repo-URL wie `https://github.com/owner/repo`
    - eine Git-URL

  </Tab>
  <Tab title="Remote marketplace rules">
    Für Remote-Marketplaces, die aus GitHub oder Git geladen werden, müssen Plugin-Einträge innerhalb des geklonten Marketplace-Repositorys bleiben. OpenClaw akzeptiert relative Pfadquellen aus diesem Repository und lehnt HTTP(S)-, absolute Pfad-, Git-, GitHub- und andere Nicht-Pfad-Plugin-Quellen aus Remote-Manifesten ab.
  </Tab>
</Tabs>

Für lokale Pfade und Archive erkennt OpenClaw automatisch:

- native OpenClaw-Plugins (`openclaw.plugin.json`)
- Codex-kompatible Bundles (`.codex-plugin/plugin.json`)
- Claude-kompatible Bundles (`.claude-plugin/plugin.json` oder das standardmäßige Claude-Komponentenlayout)
- Cursor-kompatible Bundles (`.cursor-plugin/plugin.json`)

<Note>
Kompatible Bundles werden im normalen Plugin-Stammordner installiert und nehmen am selben Ablauf für Auflisten/Info/Aktivieren/Deaktivieren teil. Derzeit werden Bundle-Skills, Claude-Befehl-Skills, Claude-Standardwerte aus `settings.json`, Claude-Standardwerte aus `.lsp.json` / im Manifest deklarierte `lspServers`, Cursor-Befehl-Skills und kompatible Codex-Hook-Verzeichnisse unterstützt; andere erkannte Bundle-Funktionen werden in Diagnose/Info angezeigt, sind aber noch nicht in die Runtime-Ausführung eingebunden.
</Note>

### Auflisten

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins search <query>
openclaw plugins search <query> --limit 20
openclaw plugins search <query> --json
```

<ParamField path="--enabled" type="boolean">
  Nur aktivierte Plugins anzeigen.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Von der Tabellenansicht zu Detailzeilen pro Plugin mit Metadaten zu Quelle/Ursprung/Version/Aktivierung wechseln.
</ParamField>
<ParamField path="--json" type="boolean">
  Maschinenlesbares Inventar plus Registry-Diagnosen und Installationsstatus von Paketabhängigkeiten.
</ParamField>

<Note>
`plugins list` liest zuerst die persistierte lokale Plugin-Registry, mit einem nur aus Manifesten abgeleiteten Fallback, wenn die Registry fehlt oder ungültig ist. Das ist nützlich, um zu prüfen, ob ein Plugin installiert, aktiviert und für die Kaltstartplanung sichtbar ist, aber es ist keine Live-Runtime-Prüfung eines bereits laufenden Gateway-Prozesses. Starten Sie nach Änderungen an Plugin-Code, Aktivierung, Hook-Richtlinie oder `plugins.load.paths` das Gateway neu, das den Kanal bedient, bevor Sie erwarten, dass neuer `register(api)`-Code oder Hooks ausgeführt werden. Prüfen Sie bei Remote-/Container-Bereitstellungen, dass Sie den tatsächlichen untergeordneten `openclaw gateway run`-Prozess neu starten, nicht nur einen Wrapper-Prozess.

`plugins list --json` enthält den `dependencyStatus` jedes Plugins aus `package.json`
`dependencies` und `optionalDependencies`. OpenClaw prüft, ob diese Paketnamen entlang des normalen Node-`node_modules`-Suchpfads des Plugins vorhanden sind; es importiert keinen Plugin-Runtime-Code, führt keinen Paketmanager aus und repariert keine fehlenden Abhängigkeiten.
</Note>

`plugins search` ist eine Remote-ClawHub-Katalogsuche. Sie prüft keinen lokalen
Status, ändert keine Konfiguration, installiert keine Pakete und lädt keinen Plugin-Runtime-Code. Suchergebnisse enthalten den ClawHub-Paketnamen, die Familie, den Kanal, die Version, die Zusammenfassung und einen
Installationshinweis wie `openclaw plugins install clawhub:<package>`.

Für Arbeiten an gebündelten Plugins innerhalb eines paketierten Docker-Images binden Sie das Plugin-Quellverzeichnis per Bind-Mount über den passenden paketierten Quellpfad ein, z. B.
`/app/extensions/synology-chat`. OpenClaw erkennt diese eingehängte Quellüberlagerung vor `/app/dist/extensions/synology-chat`; ein einfach kopiertes Quellverzeichnis bleibt inaktiv, sodass normale paketierte Installationen weiterhin die kompilierte dist-Ausgabe verwenden.

Für Runtime-Hook-Debugging:

- `openclaw plugins inspect <id> --runtime --json` zeigt registrierte Hooks und Diagnosen aus einem Inspektionsdurchlauf mit geladenem Modul. Runtime-Inspektion installiert niemals Abhängigkeiten; verwenden Sie `openclaw doctor --fix`, um veralteten Abhängigkeitsstatus zu bereinigen oder fehlende konfigurierte herunterladbare Plugins zu installieren.
- `openclaw gateway status --deep --require-rpc` bestätigt das erreichbare Gateway, Dienst-/Prozesshinweise, den Konfigurationspfad und den RPC-Zustand.
- Nicht gebündelte Konversations-Hooks (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) erfordern `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Verwenden Sie `--link`, um das Kopieren eines lokalen Verzeichnisses zu vermeiden (fügt es zu `plugins.load.paths` hinzu):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` wird mit `--link` nicht unterstützt, weil verknüpfte Installationen den Quellpfad wiederverwenden, statt ein verwaltetes Installationsziel zu überschreiben.

Verwenden Sie `--pin` bei npm-Installationen, um die aufgelöste exakte Spezifikation (`name@version`) im verwalteten Plugin-Index zu speichern, während das Standardverhalten ungepinnt bleibt.
</Note>

### Plugin-Index

Plugin-Installationsmetadaten sind maschinenverwalteter Status, keine Benutzerkonfiguration. Installationen und Updates schreiben sie in `plugins/installs.json` unter dem aktiven OpenClaw-Statusverzeichnis. Die Top-Level-Map `installRecords` ist die dauerhafte Quelle für Installationsmetadaten, einschließlich Datensätzen für beschädigte oder fehlende Plugin-Manifeste. Das Array `plugins` ist der aus Manifesten abgeleitete Cold-Registry-Cache. Die Datei enthält eine Warnung, sie nicht zu bearbeiten, und wird von `openclaw plugins update`, Deinstallation, Diagnosen und der Cold-Plugin-Registry verwendet.

Wenn OpenClaw ausgelieferte veraltete `plugins.installs`-Datensätze in der Konfiguration erkennt, verschiebt es sie in den Plugin-Index und entfernt den Konfigurationsschlüssel; falls einer der Schreibvorgänge fehlschlägt, werden die Konfigurationsdatensätze beibehalten, damit die Installationsmetadaten nicht verloren gehen.

### Deinstallieren

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` entfernt Plugin-Datensätze aus `plugins.entries`, dem persistierten Plugin-Index, Plugin-Allow-/Deny-List-Einträgen und verknüpften `plugins.load.paths`-Einträgen, wenn zutreffend. Sofern `--keep-files` nicht gesetzt ist, entfernt die Deinstallation auch das nachverfolgte verwaltete Installationsverzeichnis, wenn es sich im Plugin-Erweiterungsstamm von OpenClaw befindet. Bei Active-Memory-Plugins wird der Memory-Slot auf `memory-core` zurückgesetzt.

<Note>
`--keep-config` wird als veralteter Alias für `--keep-files` unterstützt.
</Note>

### Aktualisieren

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Updates gelten für nachverfolgte Plugin-Installationen im verwalteten Plugin-Index und nachverfolgte Hook-Pack-Installationen in `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Resolving plugin id vs npm spec">
    Wenn Sie eine Plugin-ID übergeben, verwendet OpenClaw die für dieses Plugin aufgezeichnete Installationsspezifikation wieder. Das bedeutet, dass zuvor gespeicherte Dist-Tags wie `@beta` und exakt gepinnte Versionen auch bei späteren `update <id>`-Läufen weiter verwendet werden.

    Für npm-Installationen können Sie auch eine explizite npm-Paketspezifikation mit Dist-Tag oder exakter Version übergeben. OpenClaw ordnet diesen Paketnamen wieder dem nachverfolgten Plugin-Datensatz zu, aktualisiert dieses installierte Plugin und speichert die neue npm-Spezifikation für zukünftige ID-basierte Updates.

    Die Übergabe des npm-Paketnamens ohne Version oder Tag wird ebenfalls wieder dem nachverfolgten Plugin-Datensatz zugeordnet. Verwenden Sie dies, wenn ein Plugin auf eine exakte Version gepinnt war und Sie es zurück auf die Standard-Release-Linie der Registry verschieben möchten.

  </Accordion>
  <Accordion title="Beta channel updates">
    `openclaw plugins update` verwendet die nachverfolgte Plugin-Spezifikation wieder, sofern Sie keine neue Spezifikation übergeben. `openclaw update` kennt zusätzlich den aktiven OpenClaw-Updatekanal: Im Beta-Kanal versuchen npm- und ClawHub-Plugin-Datensätze der Standardlinie zuerst `@beta` und fallen dann auf die aufgezeichnete Standard-/latest-Spezifikation zurück, wenn keine Plugin-Beta-Version existiert. Exakte Versionen und explizite Tags bleiben an diesen Selektor gepinnt.

  </Accordion>
  <Accordion title="Version checks and integrity drift">
    Vor einem Live-npm-Update prüft OpenClaw die installierte Paketversion gegen die Metadaten der npm-Registry. Wenn die installierte Version und die aufgezeichnete Artefaktidentität bereits mit dem aufgelösten Ziel übereinstimmen, wird das Update ohne Download, Neuinstallation oder Neuschreiben von `openclaw.json` übersprungen.

    Wenn ein gespeicherter Integritäts-Hash vorhanden ist und sich der Hash des abgerufenen Artefakts ändert, behandelt OpenClaw dies als npm-Artefaktabweichung. Der interaktive Befehl `openclaw plugins update` gibt den erwarteten und tatsächlichen Hash aus und bittet vor dem Fortfahren um Bestätigung. Nicht interaktive Update-Helfer schlagen geschlossen fehl, sofern der Aufrufer keine explizite Fortsetzungsrichtlinie bereitstellt.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install on update">
    `--dangerously-force-unsafe-install` ist auch bei `plugins update` als Notfall-Override für falsch positive Treffer des integrierten Dangerous-Code-Scans während Plugin-Updates verfügbar. Es umgeht weiterhin keine Plugin-`before_install`-Richtliniensperren oder Blockierungen durch Scan-Fehler und gilt nur für Plugin-Updates, nicht für Hook-Pack-Updates.
  </Accordion>
</AccordionGroup>

### Inspizieren

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect zeigt Identität, Ladestatus, Quelle, Manifest-Funktionen, Richtlinienflags, Diagnosen, Installationsmetadaten, Bundle-Funktionen und jede erkannte Unterstützung für MCP- oder LSP-Server, ohne standardmäßig Plugin-Runtime zu importieren. Fügen Sie `--runtime` hinzu, um das Plugin-Modul zu laden und registrierte Hooks, Tools, Befehle, Dienste, Gateway-Methoden und HTTP-Routen einzubeziehen. Die Runtime-Inspektion meldet fehlende Plugin-Abhängigkeiten direkt; Installationen und Reparaturen bleiben in `openclaw plugins install`, `openclaw plugins update` und `openclaw doctor --fix`.

Plugin-eigene CLI-Befehle werden als Root-Befehlsgruppen von `openclaw` installiert. Nachdem `inspect --runtime` unter `cliCommands` einen Befehl anzeigt, führen Sie ihn als `openclaw <command> ...` aus; ein Plugin, das beispielsweise `demo-git` registriert, kann mit `openclaw demo-git ping` geprüft werden.

Jedes Plugin wird danach klassifiziert, was es tatsächlich zur Runtime registriert:

- **plain-capability** — ein Fähigkeitstyp (z. B. ein reines Provider-Plugin)
- **hybrid-capability** — mehrere Fähigkeitstypen (z. B. Text + Sprache + Bilder)
- **hook-only** — nur Hooks, keine Fähigkeiten oder Oberflächen
- **non-capability** — Tools/Befehle/Dienste, aber keine Fähigkeiten

Weitere Informationen zum Fähigkeitsmodell finden Sie unter [Plugin-Formen](/de/plugins/architecture#plugin-shapes).

<Note>
Das Flag `--json` gibt einen maschinenlesbaren Bericht aus, der sich für Skripting und Auditing eignet. `inspect --all` rendert eine flottenweite Tabelle mit Spalten für Form, Fähigkeitsarten, Kompatibilitätshinweise, Bundle-Funktionen und Hook-Zusammenfassung. `info` ist ein Alias für `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` meldet Plugin-Ladefehler, Manifest-/Discovery-Diagnosen und Kompatibilitätshinweise. Wenn alles sauber ist, gibt es `No plugin issues detected.` aus.

Bei Modulform-Fehlern wie fehlenden `register`-/`activate`-Exporten führen Sie den Befehl erneut mit `OPENCLAW_PLUGIN_LOAD_DEBUG=1` aus, um eine kompakte Exportform-Zusammenfassung in die Diagnoseausgabe aufzunehmen.

### Registry

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Die lokale Plugin-Registry ist OpenClaws persistiertes Cold-Read-Modell für installierte Plugin-Identität, Aktivierung, Quellmetadaten und Eigentümerschaft von Beiträgen. Normaler Start, Provider-Owner-Suche, Kanal-Setup-Klassifizierung und Plugin-Inventar können sie lesen, ohne Plugin-Runtime-Module zu importieren.

Verwenden Sie `plugins registry`, um zu prüfen, ob die persistierte Registry vorhanden, aktuell oder veraltet ist. Verwenden Sie `--refresh`, um sie aus dem persistierten Plugin-Index, der Konfigurationsrichtlinie und Manifest-/Paketmetadaten neu aufzubauen. Dies ist ein Reparaturpfad, kein Runtime-Aktivierungspfad.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` ist ein veralteter Notfall-Kompatibilitätsschalter für Lesefehler der Registry. Verwenden Sie bevorzugt `plugins registry --refresh` oder `openclaw doctor --fix`; der Env-Fallback ist nur für die Notfallwiederherstellung beim Start gedacht, während die Migration ausgerollt wird.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Die Marketplace-Liste akzeptiert einen lokalen Marketplace-Pfad, einen `marketplace.json`-Pfad, eine GitHub-Kurzform wie `owner/repo`, eine GitHub-Repository-URL oder eine Git-URL. `--json` gibt die aufgelöste Quellbezeichnung sowie das geparste Marketplace-Manifest und die Plugin-Einträge aus.

## Verwandte Themen

- [Plugins erstellen](/de/plugins/building-plugins)
- [CLI-Referenz](/de/cli)
- [Community-Plugins](/de/plugins/community)
