---
read_when:
    - Sie möchten Gateway-Plugins oder kompatible Bundles installieren oder verwalten
    - Sie möchten Plugin-Ladefehler debuggen
sidebarTitle: Plugins
summary: CLI-Referenz für `openclaw plugins` (auflisten, installieren, Marketplace, deinstallieren, aktivieren/deaktivieren, doctor)
title: Plugins
x-i18n:
    generated_at: "2026-05-06T09:03:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: e584092c6cdaf87681aef2ed106c299e3bab0552305b669c66b05deb61bf25ce
    source_path: cli/plugins.md
    workflow: 16
---

Plugins, Hook-Packs und kompatible Bundles für das Gateway verwalten.

<CardGroup cols={2}>
  <Card title="Plugin-System" href="/de/tools/plugin">
    Leitfaden für Endbenutzer zum Installieren, Aktivieren und Beheben von Problemen mit Plugins.
  </Card>
  <Card title="Plugins verwalten" href="/de/plugins/manage-plugins">
    Kurze Beispiele für Installation, Auflisten, Aktualisierung, Deinstallation und Veröffentlichung.
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

Für die Untersuchung langsamer Installations-, Inspektions-, Deinstallations- oder Registry-Aktualisierungsvorgänge führen Sie den Befehl mit `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` aus. Der Trace schreibt Phasen-Timings nach stderr und hält die JSON-Ausgabe parsebar. Siehe [Debugging](/de/help/debugging#plugin-lifecycle-trace).

<Note>
Gebündelte Plugins werden mit OpenClaw ausgeliefert. Einige sind standardmäßig aktiviert (zum Beispiel gebündelte Modell-Provider, gebündelte Speech-Provider und das gebündelte Browser-Plugin); andere erfordern `plugins enable`.

Native OpenClaw-Plugins müssen `openclaw.plugin.json` mit einem Inline-JSON-Schema (`configSchema`, auch wenn es leer ist) ausliefern. Kompatible Bundles verwenden stattdessen ihre eigenen Bundle-Manifeste.

`plugins list` zeigt `Format: openclaw` oder `Format: bundle`. Ausführliche list/info-Ausgaben zeigen außerdem den Bundle-Untertyp (`codex`, `claude` oder `cursor`) sowie erkannte Bundle-Fähigkeiten.
</Note>

### Installieren

```bash
openclaw plugins search "calendar"                   # search ClawHub plugins
openclaw plugins install <package>                      # npm by default
openclaw plugins install clawhub:<package>              # ClawHub only
openclaw plugins install npm:<package>                  # npm only
openclaw plugins install npm-pack:<path.tgz>            # local npm pack through npm install semantics
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
Bloße Paketnamen werden während der Launch-Umstellung standardmäßig aus npm installiert. Verwenden Sie `clawhub:<package>` für ClawHub. Behandeln Sie Plugin-Installationen wie das Ausführen von Code. Bevorzugen Sie gepinnte Versionen.
</Warning>

`plugins search` fragt ClawHub nach installierbaren Plugin-Paketen ab und gibt installationsbereite Paketnamen aus. Es durchsucht Code-Plugin- und Bundle-Plugin-Pakete, nicht Skills. Verwenden Sie `openclaw skills search` für ClawHub-Skills.

<Note>
ClawHub ist die primäre Distributions- und Auffindbarkeitsoberfläche für die meisten Plugins. Npm bleibt ein unterstützter Fallback und direkter Installationspfad. OpenClaw-eigene `@openclaw/*`-Plugin-Pakete werden wieder auf npm veröffentlicht; die aktuelle Liste finden Sie auf [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) oder im [Plugin-Inventar](/de/plugins/plugin-inventory). Stabile Installationen verwenden `latest`. Installationen und Aktualisierungen im Beta-Channel bevorzugen den npm-`beta`-Dist-Tag, wenn dieser Tag verfügbar ist, und fallen dann auf `latest` zurück.
</Note>

<AccordionGroup>
  <Accordion title="Konfigurations-Includes und Reparatur ungültiger Konfigurationen">
    Wenn Ihr `plugins`-Abschnitt durch ein einzeiliges `$include` gestützt wird, schreiben `plugins install/update/enable/disable/uninstall` in diese eingebundene Datei durch und lassen `openclaw.json` unverändert. Root-Includes, Include-Arrays und Includes mit überschreibenden Geschwistern schlagen geschlossen fehl, statt abgeflacht zu werden. Siehe [Config includes](/de/gateway/configuration) für die unterstützten Formen.

    Wenn die Konfiguration während der Installation ungültig ist, schlägt `plugins install` normalerweise geschlossen fehl und weist Sie an, zuerst `openclaw doctor --fix` auszuführen. Während des Gateway-Starts und Hot Reload schlägt eine ungültige Plugin-Konfiguration wie jede andere ungültige Konfiguration geschlossen fehl; `openclaw doctor --fix` kann den ungültigen Plugin-Eintrag isolieren. Die einzige dokumentierte Ausnahme zur Installationszeit ist ein enger Wiederherstellungspfad für gebündelte Plugins, die sich explizit für `openclaw.install.allowInvalidConfigRecovery` entscheiden.

  </Accordion>
  <Accordion title="--force und Neuinstallation gegenüber Aktualisierung">
    `--force` verwendet das vorhandene Installationsziel wieder und überschreibt ein bereits installiertes Plugin oder Hook-Pack direkt. Verwenden Sie es, wenn Sie dieselbe id absichtlich von einem neuen lokalen Pfad, Archiv, ClawHub-Paket oder npm-Artefakt neu installieren. Für routinemäßige Upgrades eines bereits nachverfolgten npm-Plugins bevorzugen Sie `openclaw plugins update <id-or-npm-spec>`.

    Wenn Sie `plugins install` für eine bereits installierte Plugin-id ausführen, stoppt OpenClaw und verweist Sie für ein normales Upgrade auf `plugins update <id-or-npm-spec>` oder auf `plugins install <package> --force`, wenn Sie die aktuelle Installation wirklich aus einer anderen Quelle überschreiben möchten.

  </Accordion>
  <Accordion title="Geltungsbereich von --pin">
    `--pin` gilt nur für npm-Installationen. Es wird bei `git:`-Installationen nicht unterstützt; verwenden Sie eine explizite Git-Ref wie `git:github.com/acme/plugin@v1.2.3`, wenn Sie eine gepinnte Quelle wünschen. Es wird bei `--marketplace` nicht unterstützt, weil Marketplace-Installationen Marketplace-Quellmetadaten statt einer npm-Spezifikation speichern.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` ist eine Notfalloption für False Positives im integrierten Scanner für gefährlichen Code. Sie erlaubt, dass die Installation fortgesetzt wird, auch wenn der integrierte Scanner `critical`-Funde meldet, aber sie umgeht **nicht** Policy-Blockaden durch Plugin-`before_install`-Hooks und umgeht **nicht** Scan-Fehler.

    Dieses CLI-Flag gilt für Plugin-Installations- und Aktualisierungsabläufe. Gateway-gestützte Skill-Abhängigkeitsinstallationen verwenden die entsprechende `dangerouslyForceUnsafeInstall`-Request-Überschreibung, während `openclaw skills install` ein separater ClawHub-Skill-Download-/Installationsablauf bleibt.

    Wenn ein von Ihnen auf ClawHub veröffentlichtes Plugin durch einen Registry-Scan blockiert wird, verwenden Sie die Publisher-Schritte in [ClawHub](/de/tools/clawhub).

  </Accordion>
  <Accordion title="Hook-Packs und npm-Spezifikationen">
    `plugins install` ist auch die Installationsoberfläche für Hook-Packs, die `openclaw.hooks` in `package.json` bereitstellen. Verwenden Sie `openclaw hooks` für gefilterte Hook-Sichtbarkeit und Aktivierung pro Hook, nicht für Paketinstallation.

    Npm-Spezifikationen sind **nur Registry** (Paketname plus optionale **exakte Version** oder **Dist-Tag**). Git-/URL-/Datei-Spezifikationen und Semver-Bereiche werden abgelehnt. Abhängigkeitsinstallationen laufen zur Sicherheit projektlokal mit `--ignore-scripts`, selbst wenn Ihre Shell globale npm-Installationseinstellungen hat.

    Verwenden Sie `npm:<package>`, wenn Sie die npm-Auflösung explizit machen möchten. Bloße Paketspezifikationen werden während der Launch-Umstellung ebenfalls direkt aus npm installiert.

    Bloße Spezifikationen und `@latest` bleiben auf dem stabilen Track. OpenClaw-datumsgeprägte Korrekturversionen wie `2026.5.3-1` sind für diese Prüfung stabile Releases. Wenn npm eine dieser Varianten zu einem Prerelease auflöst, stoppt OpenClaw und fordert Sie auf, sich explizit mit einem Prerelease-Tag wie `@beta`/`@rc` oder einer exakten Prerelease-Version wie `@1.2.3-beta.4` anzumelden.

    Wenn eine bloße Installationsspezifikation mit einer offiziellen Plugin-id übereinstimmt (zum Beispiel `diffs`), installiert OpenClaw den Katalogeintrag direkt. Um ein npm-Paket mit demselben Namen zu installieren, verwenden Sie eine explizite Scoped-Spezifikation (zum Beispiel `@scope/diffs`).

  </Accordion>
  <Accordion title="Git-Repositorys">
    Verwenden Sie `git:<repo>`, um direkt aus einem Git-Repository zu installieren. Unterstützte Formen umfassen `git:github.com/owner/repo`, `git:owner/repo`, vollständige `https://`-, `ssh://`-, `git://`-, `file://`- und `git@host:owner/repo.git`-Clone-URLs. Fügen Sie `@<ref>` oder `#<ref>` hinzu, um vor der Installation einen Branch, Tag oder Commit auszuchecken.

    Git-Installationen klonen in ein temporäres Verzeichnis, checken die angeforderte Ref aus, falls vorhanden, und verwenden dann den normalen Installer für Plugin-Verzeichnisse. Das bedeutet, dass Manifestvalidierung, Scannen auf gefährlichen Code, Paketmanager-Installationsarbeit und Installationsdatensätze sich wie npm-Installationen verhalten. Aufgezeichnete Git-Installationen enthalten die Quell-URL/Ref sowie den aufgelösten Commit, damit `openclaw plugins update` die Quelle später erneut auflösen kann.

    Nach der Installation aus Git verwenden Sie `openclaw plugins inspect <id> --runtime --json`, um Runtime-Registrierungen wie Gateway-Methoden und CLI-Befehle zu prüfen. Wenn das Plugin mit `api.registerCli` eine CLI-Root registriert hat, führen Sie diesen Befehl direkt über die OpenClaw-Root-CLI aus, zum Beispiel `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archive">
    Unterstützte Archive: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Native OpenClaw-Plugin-Archive müssen ein gültiges `openclaw.plugin.json` im extrahierten Plugin-Root enthalten; Archive, die nur `package.json` enthalten, werden abgelehnt, bevor OpenClaw Installationsdatensätze schreibt.

    Verwenden Sie `npm-pack:<path.tgz>`, wenn die Datei ein npm-pack-Tarball ist und Sie denselben verwalteten npm-Root-Installationspfad testen möchten, der von Registry-Installationen verwendet wird, einschließlich `package-lock.json`-Verifizierung, Scannen gehobener Abhängigkeiten und npm-Installationsdatensätzen. Einfache Archivpfade werden weiterhin als lokale Archive unter dem Plugin-Erweiterungs-Root installiert.

    Claude-Marketplace-Installationen werden ebenfalls unterstützt.

  </Accordion>
</AccordionGroup>

ClawHub-Installationen verwenden einen expliziten `clawhub:<package>`-Locator:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Bloße npm-sichere Plugin-Spezifikationen werden während der Launch-Umstellung standardmäßig aus npm installiert:

```bash
openclaw plugins install openclaw-codex-app-server
```

Verwenden Sie `npm:`, um eine reine npm-Auflösung explizit zu machen:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw prüft die beworbene Plugin-API-/Mindest-Gateway-Kompatibilität vor der Installation. Wenn die ausgewählte ClawHub-Version ein ClawPack-Artefakt veröffentlicht, lädt OpenClaw das versionierte npm-pack-`.tgz` herunter, verifiziert den ClawHub-Digest-Header und den Artefakt-Digest und installiert es dann über den normalen Archivpfad. Ältere ClawHub-Versionen ohne ClawPack-Metadaten werden weiterhin über den Legacy-Paketarchiv-Verifizierungspfad installiert. Aufgezeichnete Installationen behalten ihre ClawHub-Quellmetadaten, Artefaktart, npm-Integrität, npm-shasum, Tarball-Namen und ClawPack-Digest-Fakten für spätere Aktualisierungen.
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
    - ein Claude-Name für bekannte Marketplaces aus `~/.claude/plugins/known_marketplaces.json`
    - ein lokaler Marketplace-Root oder ein `marketplace.json`-Pfad
    - ein GitHub-Repo-Kürzel wie `owner/repo`
    - eine GitHub-Repo-URL wie `https://github.com/owner/repo`
    - eine Git-URL

  </Tab>
  <Tab title="Remote marketplace rules">
    Bei Remote-Marketplaces, die aus GitHub oder Git geladen werden, müssen Plugin-Einträge innerhalb des geklonten Marketplace-Repos bleiben. OpenClaw akzeptiert relative Pfadquellen aus diesem Repo und lehnt HTTP(S)-, absolute Pfad-, Git-, GitHub- und andere Nicht-Pfad-Plugin-Quellen aus Remote-Manifesten ab.
  </Tab>
</Tabs>

Für lokale Pfade und Archive erkennt OpenClaw automatisch:

- native OpenClaw-Plugins (`openclaw.plugin.json`)
- Codex-kompatible Bundles (`.codex-plugin/plugin.json`)
- Claude-kompatible Bundles (`.claude-plugin/plugin.json` oder das standardmäßige Claude-Komponentenlayout)
- Cursor-kompatible Bundles (`.cursor-plugin/plugin.json`)

<Note>
Kompatible Bundles werden im normalen Plugin-Root installiert und nehmen am selben List-/Info-/Aktivieren-/Deaktivieren-Ablauf teil. Heute werden Bundle-Skills, Claude-Befehls-Skills, Claude-`settings.json`-Defaults, Claude-`.lsp.json`-/im Manifest deklarierte `lspServers`-Defaults, Cursor-Befehls-Skills und kompatible Codex-Hook-Verzeichnisse unterstützt; andere erkannte Bundle-Fähigkeiten werden in Diagnose/Info angezeigt, sind aber noch nicht in die Runtime-Ausführung eingebunden.
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
`plugins list` liest zuerst die dauerhaft gespeicherte lokale Plugin-Registry, mit einem nur aus Manifesten abgeleiteten Fallback, wenn die Registry fehlt oder ungültig ist. Das ist nützlich, um zu prüfen, ob ein Plugin installiert, aktiviert und für die Kaltstartplanung sichtbar ist, aber es ist keine Live-Runtime-Prüfung eines bereits laufenden Gateway-Prozesses. Nachdem Sie Plugin-Code, Aktivierung, Hook-Richtlinie oder `plugins.load.paths` geändert haben, starten Sie das Gateway neu, das den Kanal bedient, bevor Sie erwarten, dass neuer `register(api)`-Code oder Hooks ausgeführt werden. Prüfen Sie bei Remote-/Container-Deployments, dass Sie den tatsächlichen `openclaw gateway run`-Kindprozess neu starten, nicht nur einen Wrapper-Prozess.

`plugins list --json` enthält für jedes Plugin den `dependencyStatus` aus `package.json`
`dependencies` und `optionalDependencies`. OpenClaw prüft, ob diese Paketnamen
entlang des normalen Node-`node_modules`-Lookup-Pfads des Plugins vorhanden sind; es
importiert keinen Plugin-Runtime-Code, führt keinen Paketmanager aus und repariert
keine fehlenden Abhängigkeiten.
</Note>

`plugins search` ist eine Remote-ClawHub-Katalogsuche. Sie prüft keinen lokalen
Zustand, ändert keine Konfiguration, installiert keine Pakete und lädt keinen
Plugin-Runtime-Code. Suchergebnisse enthalten den ClawHub-Paketnamen, die Familie,
den Kanal, die Version, die Zusammenfassung und einen Installationshinweis wie
`openclaw plugins install clawhub:<package>`.

Für Arbeiten an gebündelten Plugins innerhalb eines paketierten Docker-Images mounten Sie das Plugin-
Quellverzeichnis per Bind-Mount über den passenden paketierten Quellpfad, etwa
`/app/extensions/synology-chat`. OpenClaw erkennt dieses gemountete Quell-
Overlay vor `/app/dist/extensions/synology-chat`; ein einfach kopiertes Quell-
verzeichnis bleibt inaktiv, sodass normale paketierte Installationen weiterhin das kompilierte dist verwenden.

Für Runtime-Hook-Debugging:

- `openclaw plugins inspect <id> --runtime --json` zeigt registrierte Hooks und Diagnosen aus einem Inspektionsdurchlauf mit geladenem Modul. Runtime-Inspektion installiert niemals Abhängigkeiten; verwenden Sie `openclaw doctor --fix`, um alten Abhängigkeitszustand zu bereinigen oder fehlende herunterladbare Plugins wiederherzustellen, die von der Konfiguration referenziert werden.
- `openclaw gateway status --deep --require-rpc` bestätigt das erreichbare Gateway, Dienst-/Prozesshinweise, Konfigurationspfad und RPC-Zustand.
- Nicht gebündelte Konversations-Hooks (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) erfordern `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Verwenden Sie `--link`, um das Kopieren eines lokalen Verzeichnisses zu vermeiden (fügt es zu `plugins.load.paths` hinzu):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` wird mit `--link` nicht unterstützt, weil verlinkte Installationen den Quellpfad wiederverwenden, anstatt über ein verwaltetes Installationsziel zu kopieren.

Verwenden Sie `--pin` bei npm-Installationen, um die aufgelöste exakte Spezifikation (`name@version`) im verwalteten Plugin-Index zu speichern, während das Standardverhalten ungepinnt bleibt.
</Note>

### Plugin-Index

Plugin-Installationsmetadaten sind maschinenverwalteter Zustand, keine Benutzerkonfiguration. Installationen und Updates schreiben sie in `plugins/installs.json` unter dem aktiven OpenClaw-Zustandsverzeichnis. Die `installRecords`-Map auf oberster Ebene ist die dauerhafte Quelle der Installationsmetadaten, einschließlich Datensätzen für defekte oder fehlende Plugin-Manifeste. Das `plugins`-Array ist der aus Manifesten abgeleitete Kaltstart-Registry-Cache. Die Datei enthält eine Warnung, sie nicht zu bearbeiten, und wird von `openclaw plugins update`, Deinstallation, Diagnosen und der kalten Plugin-Registry verwendet.

Wenn OpenClaw ausgelieferte alte `plugins.installs`-Datensätze in der Konfiguration sieht, verschiebt es sie in den Plugin-Index und entfernt den Konfigurationsschlüssel; wenn einer der Schreibvorgänge fehlschlägt, bleiben die Konfigurationsdatensätze erhalten, damit die Installationsmetadaten nicht verloren gehen.

### Deinstallieren

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` entfernt Plugin-Datensätze aus `plugins.entries`, dem dauerhaft gespeicherten Plugin-Index, Plugin-Allow-/Denylist-Einträgen und verlinkten `plugins.load.paths`-Einträgen, sofern zutreffend. Sofern `--keep-files` nicht gesetzt ist, entfernt die Deinstallation außerdem das nachverfolgte verwaltete Installationsverzeichnis, wenn es sich innerhalb des OpenClaw-Plugin-Erweiterungsroots befindet. Bei Active-Memory-Plugins wird der Memory-Slot auf `memory-core` zurückgesetzt.

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
    Wenn Sie eine Plugin-ID übergeben, verwendet OpenClaw die aufgezeichnete Installationsspezifikation für dieses Plugin erneut. Das bedeutet, dass zuvor gespeicherte dist-tags wie `@beta` und exakt gepinnte Versionen bei späteren `update <id>`-Ausführungen weiterverwendet werden.

    Bei npm-Installationen können Sie auch eine explizite npm-Paketspezifikation mit einem dist-tag oder einer exakten Version übergeben. OpenClaw löst diesen Paketnamen zurück auf den nachverfolgten Plugin-Datensatz auf, aktualisiert dieses installierte Plugin und zeichnet die neue npm-Spezifikation für zukünftige ID-basierte Updates auf.

    Das Übergeben des npm-Paketnamens ohne Version oder Tag löst ebenfalls zurück auf den nachverfolgten Plugin-Datensatz auf. Verwenden Sie dies, wenn ein Plugin auf eine exakte Version gepinnt war und Sie es zurück auf die Standard-Release-Linie der Registry verschieben möchten.

  </Accordion>
  <Accordion title="Beta channel updates">
    `openclaw plugins update` verwendet die nachverfolgte Plugin-Spezifikation erneut, sofern Sie keine neue Spezifikation übergeben. `openclaw update` kennt zusätzlich den aktiven OpenClaw-Update-Kanal: Auf dem Beta-Kanal versuchen npm- und ClawHub-Plugin-Datensätze der Standardlinie zuerst `@beta` und fallen dann auf die aufgezeichnete default/latest-Spezifikation zurück, falls kein Plugin-Beta-Release existiert. Exakte Versionen und explizite Tags bleiben an diesen Selektor gepinnt.

  </Accordion>
  <Accordion title="Version checks and integrity drift">
    Vor einem Live-npm-Update prüft OpenClaw die installierte Paketversion gegen die Metadaten der npm-Registry. Wenn die installierte Version und die aufgezeichnete Artefaktidentität bereits dem aufgelösten Ziel entsprechen, wird das Update übersprungen, ohne herunterzuladen, neu zu installieren oder `openclaw.json` neu zu schreiben.

    Wenn ein gespeicherter Integritäts-Hash existiert und sich der Hash des abgerufenen Artefakts ändert, behandelt OpenClaw dies als npm-Artefaktdrift. Der interaktive Befehl `openclaw plugins update` gibt die erwarteten und tatsächlichen Hashes aus und fragt vor dem Fortfahren nach Bestätigung. Nicht interaktive Update-Helfer schlagen geschlossen fehl, sofern der Aufrufer keine explizite Fortsetzungsrichtlinie bereitstellt.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install on update">
    `--dangerously-force-unsafe-install` ist auch bei `plugins update` als Notfall-Override für False Positives des eingebauten Dangerous-Code-Scans während Plugin-Updates verfügbar. Es umgeht weiterhin keine Plugin-`before_install`-Richtlinienblockaden oder Blockaden durch Scan-Fehler und gilt nur für Plugin-Updates, nicht für Hook-Pack-Updates.
  </Accordion>
</AccordionGroup>

### Inspizieren

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect zeigt Identität, Ladestatus, Quelle, Manifest-Fähigkeiten, Richtlinien-Flags, Diagnosen, Installationsmetadaten, Bundle-Fähigkeiten und erkannte MCP- oder LSP-Server-Unterstützung, ohne standardmäßig Plugin-Runtime zu importieren. Fügen Sie `--runtime` hinzu, um das Plugin-Modul zu laden und registrierte Hooks, Tools, Befehle, Dienste, Gateway-Methoden und HTTP-Routen einzuschließen. Runtime-Inspektion meldet fehlende Plugin-Abhängigkeiten direkt; Installationen und Reparaturen bleiben in `openclaw plugins install`, `openclaw plugins update` und `openclaw doctor --fix`.

Plugin-eigene CLI-Befehle werden als Root-`openclaw`-Befehlsgruppen installiert. Nachdem `inspect --runtime` einen Befehl unter `cliCommands` zeigt, führen Sie ihn als `openclaw <command> ...` aus; beispielsweise kann ein Plugin, das `demo-git` registriert, mit `openclaw demo-git ping` geprüft werden.

Jedes Plugin wird danach klassifiziert, was es tatsächlich zur Runtime registriert:

- **plain-capability** — ein Fähigkeitstyp (z. B. ein Provider-only-Plugin)
- **hybrid-capability** — mehrere Fähigkeitstypen (z. B. Text + Sprache + Bilder)
- **hook-only** — nur Hooks, keine Fähigkeiten oder Oberflächen
- **non-capability** — Tools/Befehle/Dienste, aber keine Fähigkeiten

Weitere Informationen zum Fähigkeitsmodell finden Sie unter [Plugin-Formen](/de/plugins/architecture#plugin-shapes).

<Note>
Das Flag `--json` gibt einen maschinenlesbaren Bericht aus, der sich für Scripting und Audits eignet. `inspect --all` rendert eine flottenweite Tabelle mit Spalten für Form, Fähigkeitstypen, Kompatibilitätshinweise, Bundle-Fähigkeiten und Hook-Zusammenfassung. `info` ist ein Alias für `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` meldet Plugin-Ladefehler, Manifest-/Discovery-Diagnosen und Kompatibilitätshinweise. Wenn alles sauber ist, gibt es `No plugin issues detected.` aus

Wenn ein konfiguriertes Plugin auf der Festplatte vorhanden ist, aber durch die Pfadsicherheitsprüfungen des Loaders blockiert wird, behält die Konfigurationsvalidierung den Plugin-Eintrag bei und meldet ihn als `present but blocked`. Beheben Sie die vorherige Diagnose für blockierte Plugins, etwa Pfadbesitz oder weltbeschreibbare Berechtigungen, anstatt die Konfiguration `plugins.entries.<id>` oder `plugins.allow` zu entfernen.

Bei Modulform-Fehlern wie fehlenden `register`-/`activate`-Exports führen Sie den Befehl erneut mit `OPENCLAW_PLUGIN_LOAD_DEBUG=1` aus, um eine kompakte Exportform-Zusammenfassung in die Diagnoseausgabe aufzunehmen.

### Registry

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Die lokale Plugin-Registry ist das persistierte Cold-Read-Modell von OpenClaw für die Identität installierter Plugins, deren Aktivierung, Quellmetadaten und Contribution-Ownership. Normaler Start, Provider-Owner-Lookup, Klassifizierung der Kanal-Einrichtung und Plugin-Inventar können sie lesen, ohne Plugin-Laufzeitmodule zu importieren.

Verwenden Sie `plugins registry`, um zu prüfen, ob die persistierte Registry vorhanden, aktuell oder veraltet ist. Verwenden Sie `--refresh`, um sie aus dem persistierten Plugin-Index, der Konfigurationsrichtlinie und den Manifest-/Paketmetadaten neu aufzubauen. Dies ist ein Reparaturpfad, kein Pfad zur Laufzeitaktivierung.

`openclaw doctor --fix` repariert außerdem registry-nahe managed npm-Abweichungen: Wenn ein verwaistes oder wiederhergestelltes `@openclaw/*`-Paket unter der managed Plugin-npm-Wurzel ein gebündeltes Plugin überdeckt, entfernt doctor dieses veraltete Paket und baut die Registry neu auf, damit der Start gegen das gebündelte Manifest validiert.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` ist ein veralteter Break-Glass-Kompatibilitätsschalter für Registry-Lesefehler. Bevorzugen Sie `plugins registry --refresh` oder `openclaw doctor --fix`; der Env-Fallback ist nur für die Notfallwiederherstellung beim Start gedacht, während die Migration ausgerollt wird.
</Warning>

### Marktplatz

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Die Marketplace-Liste akzeptiert einen lokalen Marketplace-Pfad, einen `marketplace.json`-Pfad, eine GitHub-Kurzform wie `owner/repo`, eine GitHub-Repo-URL oder eine Git-URL. `--json` gibt das aufgelöste Quellenlabel sowie das geparste Marketplace-Manifest und die Plugin-Einträge aus.

## Verwandte Themen

- [Plugins erstellen](/de/plugins/building-plugins)
- [CLI-Referenz](/de/cli)
- [Community-Plugins](/de/plugins/community)
