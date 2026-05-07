---
read_when:
    - Sie möchten Gateway-Plugins oder kompatible Bundles installieren oder verwalten
    - Sie möchten Fehler beim Laden von Plugins debuggen
sidebarTitle: Plugins
summary: CLI-Referenz für `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugins
x-i18n:
    generated_at: "2026-05-07T13:14:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 73023d11309c5dc4fe9fab9cffc0f7d96de1e1c22ce1ec4d2cd22d2aa4808f1a
    source_path: cli/plugins.md
    workflow: 16
---

Verwalten Sie Gateway-Plugins, Hook-Packs und kompatible Bundles.

<CardGroup cols={2}>
  <Card title="Plugin-System" href="/de/tools/plugin">
    Leitfaden für Endbenutzer zum Installieren, Aktivieren und Beheben von Problemen mit Plugins.
  </Card>
  <Card title="Plugins verwalten" href="/de/plugins/manage-plugins">
    Kurze Beispiele für Installation, Auflistung, Aktualisierung, Deinstallation und Veröffentlichung.
  </Card>
  <Card title="Plugin-Bundles" href="/de/plugins/bundles">
    Bundle-Kompatibilitätsmodell.
  </Card>
  <Card title="Plugin-Manifest" href="/de/plugins/manifest">
    Manifest-Felder und Konfigurationsschema.
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

Führen Sie zur Untersuchung langsamer Installations-, Inspektions-, Deinstallations- oder Registry-Aktualisierungsvorgänge den Befehl mit `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` aus. Der Trace schreibt Phasen-Timings nach stderr und hält JSON-Ausgaben parsbar. Siehe [Debugging](/de/help/debugging#plugin-lifecycle-trace).

<Note>
Im Nix-Modus (`OPENCLAW_NIX_MODE=1`) sind Mutatoren für den Plugin-Lebenszyklus deaktiviert. Verwenden Sie für diese Installation die Nix-Quelle anstelle von `plugins install`, `plugins update`, `plugins uninstall`, `plugins enable` oder `plugins disable`; für nix-openclaw verwenden Sie den agentenorientierten [Schnellstart](https://github.com/openclaw/nix-openclaw#quick-start).
</Note>

<Note>
Gebündelte Plugins werden mit OpenClaw ausgeliefert. Einige sind standardmäßig aktiviert (zum Beispiel gebündelte Modell-Provider, gebündelte Sprach-Provider und das gebündelte Browser-Plugin); andere erfordern `plugins enable`.

Native OpenClaw-Plugins müssen `openclaw.plugin.json` mit einem Inline-JSON-Schema (`configSchema`, auch wenn leer) ausliefern. Kompatible Bundles verwenden stattdessen ihre eigenen Bundle-Manifeste.

`plugins list` zeigt `Format: openclaw` oder `Format: bundle`. Ausführliche list/info-Ausgaben zeigen außerdem den Bundle-Untertyp (`codex`, `claude` oder `cursor`) sowie erkannte Bundle-Funktionen.
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
Bloße Paketnamen installieren während der Startumstellung standardmäßig aus npm. Verwenden Sie `clawhub:<package>` für ClawHub. Behandeln Sie Plugin-Installationen wie das Ausführen von Code. Bevorzugen Sie gepinnte Versionen.
</Warning>

`plugins search` fragt ClawHub nach installierbaren Plugin-Paketen ab und gibt installationsbereite Paketnamen aus. Es sucht nach Code-Plugin- und Bundle-Plugin-Paketen, nicht nach Skills. Verwenden Sie `openclaw skills search` für ClawHub-Skills.

<Note>
ClawHub ist die primäre Oberfläche für Distribution und Auffindbarkeit der meisten Plugins. Npm bleibt ein unterstützter Fallback und direkter Installationspfad. OpenClaw-eigene `@openclaw/*`-Plugin-Pakete werden wieder auf npm veröffentlicht; die aktuelle Liste finden Sie auf [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) oder im [Plugin-Inventar](/de/plugins/plugin-inventory). Stabile Installationen verwenden `latest`. Installationen und Aktualisierungen im Beta-Kanal bevorzugen das npm-`beta`-dist-tag, wenn dieses Tag verfügbar ist, und fallen dann auf `latest` zurück.
</Note>

<AccordionGroup>
  <Accordion title="Konfigurations-Includes und Reparatur ungültiger Konfiguration">
    Wenn Ihr `plugins`-Abschnitt durch ein einzeldateibasiertes `$include` gestützt wird, schreiben `plugins install/update/enable/disable/uninstall` in diese eingebundene Datei durch und lassen `openclaw.json` unverändert. Root-Includes, Include-Arrays und Includes mit nebengeordneten Überschreibungen schlagen geschlossen fehl, anstatt abgeflacht zu werden. Siehe [Konfigurations-Includes](/de/gateway/configuration) für die unterstützten Formen.

    Wenn die Konfiguration während der Installation ungültig ist, schlägt `plugins install` normalerweise geschlossen fehl und fordert Sie auf, zuerst `openclaw doctor --fix` auszuführen. Während des Gateway-Starts und Hot Reloads schlägt eine ungültige Plugin-Konfiguration geschlossen fehl wie jede andere ungültige Konfiguration; `openclaw doctor --fix` kann den ungültigen Plugin-Eintrag unter Quarantäne stellen. Die einzige dokumentierte Ausnahme zur Installationszeit ist ein enger Wiederherstellungspfad für gebündelte Plugins, die sich explizit für `openclaw.install.allowInvalidConfigRecovery` entscheiden.

  </Accordion>
  <Accordion title="--force und Neuinstallation gegenüber Aktualisierung">
    `--force` verwendet das vorhandene Installationsziel wieder und überschreibt ein bereits installiertes Plugin oder Hook-Pack an Ort und Stelle. Verwenden Sie dies, wenn Sie absichtlich dieselbe ID aus einem neuen lokalen Pfad, Archiv, ClawHub-Paket oder npm-Artefakt neu installieren. Für routinemäßige Upgrades eines bereits verfolgten npm-Plugins bevorzugen Sie `openclaw plugins update <id-or-npm-spec>`.

    Wenn Sie `plugins install` für eine Plugin-ID ausführen, die bereits installiert ist, stoppt OpenClaw und verweist Sie für ein normales Upgrade auf `plugins update <id-or-npm-spec>` oder auf `plugins install <package> --force`, wenn Sie die aktuelle Installation wirklich aus einer anderen Quelle überschreiben möchten.

  </Accordion>
  <Accordion title="Geltungsbereich von --pin">
    `--pin` gilt nur für npm-Installationen. Es wird bei `git:`-Installationen nicht unterstützt; verwenden Sie eine explizite Git-Referenz wie `git:github.com/acme/plugin@v1.2.3`, wenn Sie eine gepinnte Quelle wünschen. Es wird nicht mit `--marketplace` unterstützt, weil Marketplace-Installationen Marketplace-Quellmetadaten anstelle einer npm-Spezifikation dauerhaft speichern.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` ist eine Notfalloption für False Positives im integrierten Scanner für gefährlichen Code. Sie erlaubt das Fortsetzen der Installation, auch wenn der integrierte Scanner `critical`-Befunde meldet, umgeht aber **nicht** Richtlinienblockaden durch Plugin-`before_install`-Hooks und umgeht **nicht** Scan-Fehler.

    Dieses CLI-Flag gilt für Plugin-Installations- und Aktualisierungsabläufe. Gateway-gestützte Installationen von Skill-Abhängigkeiten verwenden den passenden `dangerouslyForceUnsafeInstall`-Request-Override, während `openclaw skills install` ein separater ClawHub-Ablauf zum Herunterladen und Installieren von Skills bleibt.

    Wenn ein von Ihnen auf ClawHub veröffentlichtes Plugin durch einen Registry-Scan blockiert wird, verwenden Sie die Publisher-Schritte in [ClawHub](/de/tools/clawhub).

  </Accordion>
  <Accordion title="Hook-Packs und npm-Spezifikationen">
    `plugins install` ist auch die Installationsoberfläche für Hook-Packs, die `openclaw.hooks` in `package.json` bereitstellen. Verwenden Sie `openclaw hooks` für gefilterte Hook-Sichtbarkeit und Aktivierung einzelner Hooks, nicht für Paketinstallationen.

    Npm-Spezifikationen sind **nur Registry-basiert** (Paketname plus optionale **exakte Version** oder **dist-tag**). Git-/URL-/Datei-Spezifikationen und Semver-Bereiche werden abgelehnt. Abhängigkeitsinstallationen laufen projeklokal mit `--ignore-scripts` aus Sicherheitsgründen, selbst wenn Ihre Shell globale npm-Installationseinstellungen hat. Verwaltete Plugin-npm-Roots erben die paketweiten npm-`overrides` von OpenClaw, sodass Host-Sicherheitspins auch für gehobene Plugin-Abhängigkeiten gelten.

    Verwenden Sie `npm:<package>`, wenn Sie die npm-Auflösung explizit machen möchten. Bloße Paketspezifikationen installieren während der Startumstellung ebenfalls direkt aus npm.

    Bloße Spezifikationen und `@latest` bleiben auf dem stabilen Track. Datumsstempel-Korrekturversionen von OpenClaw wie `2026.5.3-1` sind für diese Prüfung stabile Releases. Wenn npm eine davon zu einem Prerelease auflöst, stoppt OpenClaw und fordert Sie auf, sich explizit mit einem Prerelease-Tag wie `@beta`/`@rc` oder einer exakten Prerelease-Version wie `@1.2.3-beta.4` zu entscheiden.

    Wenn eine bloße Installationsspezifikation mit einer offiziellen Plugin-ID übereinstimmt (zum Beispiel `diffs`), installiert OpenClaw den Katalogeintrag direkt. Um ein npm-Paket mit demselben Namen zu installieren, verwenden Sie eine explizite scoped Spezifikation (zum Beispiel `@scope/diffs`).

  </Accordion>
  <Accordion title="Git-Repositorys">
    Verwenden Sie `git:<repo>`, um direkt aus einem Git-Repository zu installieren. Unterstützte Formen umfassen `git:github.com/owner/repo`, `git:owner/repo`, vollständige `https://`-, `ssh://`-, `git://`-, `file://`- und `git@host:owner/repo.git`-Clone-URLs. Fügen Sie `@<ref>` oder `#<ref>` hinzu, um vor der Installation einen Branch, ein Tag oder einen Commit auszuchecken.

    Git-Installationen klonen in ein temporäres Verzeichnis, checken die angeforderte Referenz aus, sofern vorhanden, und verwenden dann den normalen Installer für Plugin-Verzeichnisse. Das bedeutet, dass Manifest-Validierung, Scans auf gefährlichen Code, Paketmanager-Installationsarbeit und Installationsdatensätze sich wie bei npm-Installationen verhalten. Aufgezeichnete Git-Installationen enthalten die Quell-URL/-Referenz plus den aufgelösten Commit, damit `openclaw plugins update` die Quelle später erneut auflösen kann.

    Verwenden Sie nach der Installation aus Git `openclaw plugins inspect <id> --runtime --json`, um Laufzeitregistrierungen wie Gateway-Methoden und CLI-Befehle zu verifizieren. Wenn das Plugin mit `api.registerCli` einen CLI-Root registriert hat, führen Sie diesen Befehl direkt über die Root-CLI von OpenClaw aus, zum Beispiel `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archive">
    Unterstützte Archive: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Native OpenClaw-Plugin-Archive müssen ein gültiges `openclaw.plugin.json` im extrahierten Plugin-Root enthalten; Archive, die nur `package.json` enthalten, werden abgelehnt, bevor OpenClaw Installationsdatensätze schreibt.

    Verwenden Sie `npm-pack:<path.tgz>`, wenn die Datei ein npm-pack-Tarball ist und Sie denselben verwalteten npm-Root-Installationspfad testen möchten, der von Registry-Installationen verwendet wird, einschließlich `package-lock.json`-Verifizierung, Scans gehobener Abhängigkeiten und npm-Installationsdatensätzen. Einfache Archivpfade installieren weiterhin als lokale Archive unter dem Plugin-Erweiterungs-Root.

    Claude-Marketplace-Installationen werden ebenfalls unterstützt.

  </Accordion>
</AccordionGroup>

ClawHub-Installationen verwenden einen expliziten `clawhub:<package>`-Locator:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Bloße npm-sichere Plugin-Spezifikationen installieren während der Startumstellung standardmäßig aus npm:

```bash
openclaw plugins install openclaw-codex-app-server
```

Verwenden Sie `npm:`, um die reine npm-Auflösung explizit zu machen:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw prüft vor der Installation die angekündigte Plugin-API / Mindestkompatibilität mit dem Gateway. Wenn die ausgewählte ClawHub-Version ein ClawPack-Artefakt veröffentlicht, lädt OpenClaw das versionierte npm-Pack `.tgz` herunter, verifiziert den ClawHub-Digest-Header und den Artefakt-Digest und installiert es anschließend über den normalen Archivpfad. Ältere ClawHub-Versionen ohne ClawPack-Metadaten werden weiterhin über den Legacy-Pfad zur Verifizierung von Paketarchiven installiert. Aufgezeichnete Installationen behalten ihre ClawHub-Quellmetadaten, die Artefaktart, npm-Integrität, npm-shasum, den Tarball-Namen und ClawPack-Digest-Fakten für spätere Updates.
Nicht versionierte ClawHub-Installationen behalten eine nicht versionierte aufgezeichnete Spezifikation, damit `openclaw plugins update` neueren ClawHub-Releases folgen kann; explizite Versions- oder Tag-Selektoren wie `clawhub:pkg@1.2.3` und `clawhub:pkg@beta` bleiben an diesen Selektor gebunden.

#### Marketplace-Kurzschreibweise

Verwenden Sie die Kurzschreibweise `plugin@marketplace`, wenn der Marketplace-Name in Claudes lokalem Registry-Cache unter `~/.claude/plugins/known_marketplaces.json` vorhanden ist:

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
    - ein lokaler Marketplace-Root oder `marketplace.json`-Pfad
    - eine GitHub-Repo-Kurzschreibweise wie `owner/repo`
    - eine GitHub-Repo-URL wie `https://github.com/owner/repo`
    - eine Git-URL

  </Tab>
  <Tab title="Remote marketplace rules">
    Bei Remote-Marketplaces, die aus GitHub oder Git geladen werden, müssen Plugin-Einträge innerhalb des geklonten Marketplace-Repos bleiben. OpenClaw akzeptiert relative Pfadquellen aus diesem Repo und lehnt HTTP(S)-, Absolutpfad-, Git-, GitHub- und andere Nicht-Pfad-Plugin-Quellen aus Remote-Manifesten ab.
  </Tab>
</Tabs>

Für lokale Pfade und Archive erkennt OpenClaw automatisch:

- native OpenClaw-Plugins (`openclaw.plugin.json`)
- Codex-kompatible Bundles (`.codex-plugin/plugin.json`)
- Claude-kompatible Bundles (`.claude-plugin/plugin.json` oder das standardmäßige Claude-Komponentenlayout)
- Cursor-kompatible Bundles (`.cursor-plugin/plugin.json`)

<Note>
Kompatible Bundles werden im normalen Plugin-Root installiert und nehmen am gleichen Ablauf für Auflisten/Info/Aktivieren/Deaktivieren teil. Derzeit werden Bundle-Skills, Claude-Befehl-Skills, Claude-`settings.json`-Standardwerte, Claude-`.lsp.json`- / per Manifest deklarierte `lspServers`-Standardwerte, Cursor-Befehl-Skills und kompatible Codex-Hook-Verzeichnisse unterstützt; andere erkannte Bundle-Fähigkeiten werden in Diagnosen/Infos angezeigt, sind aber noch nicht in die Laufzeitausführung eingebunden.
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
  Von der Tabellenansicht zu Detailzeilen pro Plugin mit Quell-/Ursprungs-/Versions-/Aktivierungsmetadaten wechseln.
</ParamField>
<ParamField path="--json" type="boolean">
  Maschinenlesbarer Bestand plus Registry-Diagnosen und Installationsstatus von Paketabhängigkeiten.
</ParamField>

<Note>
`plugins list` liest zuerst die persistierte lokale Plugin-Registry, mit einem nur aus dem Manifest abgeleiteten Fallback, wenn die Registry fehlt oder ungültig ist. Dies ist nützlich, um zu prüfen, ob ein Plugin installiert, aktiviert und für die Planung eines Kaltstarts sichtbar ist, aber es ist keine Live-Laufzeitprüfung eines bereits laufenden Gateway-Prozesses. Nachdem Sie Plugin-Code, Aktivierung, Hook-Richtlinie oder `plugins.load.paths` geändert haben, starten Sie das Gateway neu, das den Kanal bedient, bevor Sie erwarten, dass neuer `register(api)`-Code oder Hooks ausgeführt werden. Prüfen Sie bei Remote-/Container-Deployments, dass Sie den tatsächlichen untergeordneten `openclaw gateway run`-Prozess neu starten, nicht nur einen Wrapper-Prozess.

`plugins list --json` enthält für jedes Plugin den `dependencyStatus` aus `dependencies` und `optionalDependencies` in `package.json`. OpenClaw prüft, ob diese Paketnamen entlang des normalen Node-`node_modules`-Suchpfads des Plugins vorhanden sind; es importiert keinen Plugin-Laufzeitcode, führt keinen Paketmanager aus und repariert keine fehlenden Abhängigkeiten.
</Note>

`plugins search` ist eine Remote-ClawHub-Katalogsuche. Sie prüft keinen lokalen
Zustand, ändert keine Konfiguration, installiert keine Pakete und lädt keinen Plugin-Laufzeitcode. Suchergebnisse enthalten den ClawHub-Paketnamen, die Familie, den Kanal, die Version, die Zusammenfassung und
einen Installationshinweis wie `openclaw plugins install clawhub:<package>`.

Für Arbeiten an gebündelten Plugins innerhalb eines paketierten Docker-Images binden Sie das Plugin-Quellverzeichnis über den passenden paketierten Quellpfad ein, zum Beispiel
`/app/extensions/synology-chat`. OpenClaw erkennt dieses eingehängte Quell-Overlay vor `/app/dist/extensions/synology-chat`; ein schlicht kopiertes Quellverzeichnis bleibt inaktiv, sodass normale paketierte Installationen weiterhin die kompilierte Distribution verwenden.

Für das Debugging von Laufzeit-Hooks:

- `openclaw plugins inspect <id> --runtime --json` zeigt registrierte Hooks und Diagnosen aus einem Inspektionsdurchlauf mit geladenem Modul. Die Laufzeitinspektion installiert niemals Abhängigkeiten; verwenden Sie `openclaw doctor --fix`, um Legacy-Abhängigkeitszustand zu bereinigen oder fehlende herunterladbare Plugins wiederherzustellen, die in der Konfiguration referenziert werden.
- `openclaw gateway status --deep --require-rpc` bestätigt das erreichbare Gateway, Service-/Prozesshinweise, den Konfigurationspfad und die RPC-Gesundheit.
- Nicht gebündelte Konversations-Hooks (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) erfordern `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Verwenden Sie `--link`, um das Kopieren eines lokalen Verzeichnisses zu vermeiden (fügt es zu `plugins.load.paths` hinzu):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` wird mit `--link` nicht unterstützt, weil verknüpfte Installationen den Quellpfad wiederverwenden, statt über ein verwaltetes Installationsziel zu kopieren.

Verwenden Sie `--pin` bei npm-Installationen, um die aufgelöste exakte Spezifikation (`name@version`) im verwalteten Plugin-Index zu speichern, während das Standardverhalten ungebunden bleibt.
</Note>

### Plugin-Index

Plugin-Installationsmetadaten sind maschinenverwalteter Zustand, keine Benutzerkonfiguration. Installationen und Updates schreiben sie unter der aktiven OpenClaw-Zustandsdirectory in `plugins/installs.json`. Die `installRecords`-Map auf oberster Ebene ist die dauerhafte Quelle für Installationsmetadaten, einschließlich Einträgen für defekte oder fehlende Plugin-Manifeste. Das Array `plugins` ist der aus Manifesten abgeleitete Kalt-Registry-Cache. Die Datei enthält eine Warnung, sie nicht zu bearbeiten, und wird von `openclaw plugins update`, Deinstallation, Diagnosen und der kalten Plugin-Registry verwendet.

Wenn OpenClaw ausgelieferte Legacy-`plugins.installs`-Einträge in der Konfiguration sieht, behandeln Laufzeit-Lesevorgänge sie als Kompatibilitätseingabe, ohne `openclaw.json` neu zu schreiben. Explizite Plugin-Schreibvorgänge und `openclaw doctor --fix` verschieben diese Einträge in den Plugin-Index und entfernen den Konfigurationsschlüssel, wenn Konfigurationsschreibvorgänge erlaubt sind; wenn einer der Schreibvorgänge fehlschlägt, bleiben die Konfigurationseinträge erhalten, damit die Installationsmetadaten nicht verloren gehen.

### Deinstallieren

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` entfernt Plugin-Einträge aus `plugins.entries`, dem persistierten Plugin-Index, Plugin-Zulassungs-/Sperrlisteneinträgen und verknüpften `plugins.load.paths`-Einträgen, sofern zutreffend. Sofern `--keep-files` nicht gesetzt ist, entfernt die Deinstallation auch das nachverfolgte verwaltete Installationsverzeichnis, wenn es sich innerhalb des Plugin-Erweiterungsroots von OpenClaw befindet. Bei Active-Memory-Plugins wird der Memory-Slot auf `memory-core` zurückgesetzt.

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
    Wenn Sie eine Plugin-ID übergeben, verwendet OpenClaw die aufgezeichnete Installationsspezifikation für dieses Plugin erneut. Das bedeutet, dass zuvor gespeicherte Dist-Tags wie `@beta` und exakt gebundene Versionen bei späteren `update <id>`-Ausführungen weiter verwendet werden.

    Bei npm-Installationen können Sie auch eine explizite npm-Paketspezifikation mit einem Dist-Tag oder einer exakten Version übergeben. OpenClaw löst diesen Paketnamen zurück auf den nachverfolgten Plugin-Eintrag auf, aktualisiert dieses installierte Plugin und zeichnet die neue npm-Spezifikation für zukünftige ID-basierte Updates auf.

    Wenn Sie den npm-Paketnamen ohne Version oder Tag übergeben, wird er ebenfalls zurück auf den nachverfolgten Plugin-Eintrag aufgelöst. Verwenden Sie dies, wenn ein Plugin an eine exakte Version gebunden war und Sie es zurück auf die Standard-Release-Linie der Registry verschieben möchten.

  </Accordion>
  <Accordion title="Beta channel updates">
    `openclaw plugins update` verwendet die nachverfolgte Plugin-Spezifikation erneut, sofern Sie keine neue Spezifikation übergeben. `openclaw update` kennt zusätzlich den aktiven OpenClaw-Updatekanal: Auf dem Beta-Kanal versuchen npm- und ClawHub-Plugin-Einträge der Standardlinie zuerst `@beta` und fallen dann auf die aufgezeichnete Standard-/Latest-Spezifikation zurück, wenn kein Plugin-Beta-Release vorhanden ist. Exakte Versionen und explizite Tags bleiben an diesen Selektor gebunden.

  </Accordion>
  <Accordion title="Version checks and integrity drift">
    Vor einem Live-npm-Update prüft OpenClaw die installierte Paketversion gegen die npm-Registry-Metadaten. Wenn die installierte Version und die aufgezeichnete Artefaktidentität bereits mit dem aufgelösten Ziel übereinstimmen, wird das Update ohne Download, Neuinstallation oder Neuschreiben von `openclaw.json` übersprungen.

    Wenn ein gespeicherter Integritäts-Hash vorhanden ist und sich der abgerufene Artefakt-Hash ändert, behandelt OpenClaw dies als npm-Artefaktdrift. Der interaktive Befehl `openclaw plugins update` gibt die erwarteten und tatsächlichen Hashes aus und bittet vor dem Fortfahren um Bestätigung. Nicht interaktive Update-Helfer schlagen geschlossen fehl, sofern der Aufrufer keine explizite Fortsetzungsrichtlinie bereitstellt.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install on update">
    `--dangerously-force-unsafe-install` ist auch bei `plugins update` als Break-Glass-Override für False Positives der eingebauten Dangerous-Code-Prüfung während Plugin-Updates verfügbar. Es umgeht weiterhin keine Plugin-`before_install`-Richtlinienblöcke oder Blockierungen aufgrund fehlgeschlagener Scans und gilt nur für Plugin-Updates, nicht für Hook-Pack-Updates.
  </Accordion>
</AccordionGroup>

### Inspizieren

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect zeigt Identität, Ladestatus, Quelle, Manifestfähigkeiten, Richtlinien-Flags, Diagnosen, Installationsmetadaten, Bundle-Fähigkeiten und jede erkannte MCP- oder LSP-Server-Unterstützung, ohne standardmäßig den Plugin-Laufzeitcode zu importieren. Fügen Sie `--runtime` hinzu, um das Plugin-Modul zu laden und registrierte Hooks, Tools, Befehle, Services, Gateway-Methoden und HTTP-Routen einzubeziehen. Die Laufzeitinspektion meldet fehlende Plugin-Abhängigkeiten direkt; Installationen und Reparaturen bleiben in `openclaw plugins install`, `openclaw plugins update` und `openclaw doctor --fix`.

Plugin-eigene CLI-Befehle werden normalerweise als Root-`openclaw`-Befehlsgruppen installiert, Plugins können aber auch verschachtelte Befehle unter einem Core-Elternbefehl wie `openclaw nodes` registrieren. Nachdem `inspect --runtime` einen Befehl unter `cliCommands` anzeigt, führen Sie ihn unter dem aufgeführten Pfad aus; zum Beispiel kann ein Plugin, das `demo-git` registriert, mit `openclaw demo-git ping` verifiziert werden.

Jedes Plugin wird danach klassifiziert, was es tatsächlich zur Laufzeit registriert:

- **plain-capability** — ein Capability-Typ (z. B. ein reines Provider-Plugin)
- **hybrid-capability** — mehrere Capability-Typen (z. B. Text + Sprache + Bilder)
- **hook-only** — nur Hooks, keine Capabilities oder Oberflächen
- **non-capability** — Tools/Befehle/Dienste, aber keine Capabilities

Weitere Informationen zum Capability-Modell finden Sie unter [Plugin-Formen](/de/plugins/architecture#plugin-shapes).

<Note>
Das Flag `--json` gibt einen maschinenlesbaren Bericht aus, der sich für Skripting und Audits eignet. `inspect --all` rendert eine flottenweite Tabelle mit Form, Capability-Arten, Kompatibilitätshinweisen, Bundle-Capabilities und Hook-Zusammenfassungsspalten. `info` ist ein Alias für `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` meldet Plugin-Ladefehler, Manifest-/Discovery-Diagnosen und Kompatibilitätshinweise. Wenn alles sauber ist, gibt es `No plugin issues detected.` aus.

Wenn ein konfiguriertes Plugin auf dem Datenträger vorhanden ist, aber durch die Pfadsicherheitsprüfungen des Loaders blockiert wird, behält die Konfigurationsvalidierung den Plugin-Eintrag bei und meldet ihn als `present but blocked`. Beheben Sie die vorhergehende Diagnose zum blockierten Plugin, etwa Pfadbesitz oder weltweit beschreibbare Berechtigungen, statt die Konfiguration `plugins.entries.<id>` oder `plugins.allow` zu entfernen.

Bei Modulform-Fehlern wie fehlenden `register`-/`activate`-Exports führen Sie den Befehl erneut mit `OPENCLAW_PLUGIN_LOAD_DEBUG=1` aus, um eine kompakte Zusammenfassung der Export-Form in die Diagnoseausgabe aufzunehmen.

### Registry

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Die lokale Plugin-Registry ist das persistierte Cold-Read-Modell von OpenClaw für installierte Plugin-Identität, Aktivierung, Quellmetadaten und Besitz von Beiträgen. Normaler Start, Provider-Besitzerlookup, Klassifizierung der Channel-Einrichtung und Plugin-Inventar können sie lesen, ohne Plugin-Runtime-Module zu importieren.

Verwenden Sie `plugins registry`, um zu prüfen, ob die persistierte Registry vorhanden, aktuell oder veraltet ist. Verwenden Sie `--refresh`, um sie aus dem persistierten Plugin-Index, der Konfigurationsrichtlinie und Manifest-/Paketmetadaten neu aufzubauen. Dies ist ein Reparaturpfad, kein Runtime-Aktivierungspfad.

`openclaw doctor --fix` repariert auch Registry-nahe managed-npm-Abweichungen: Wenn ein verwaistes oder wiederhergestelltes `@openclaw/*`-Paket unter dem managed-Plugin-npm-Root ein gebündeltes Plugin überschattet, entfernt doctor dieses veraltete Paket und baut die Registry neu auf, damit der Start gegen das gebündelte Manifest validiert.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` ist ein veralteter Break-Glass-Kompatibilitätsschalter für Registry-Lesefehler. Bevorzugen Sie `plugins registry --refresh` oder `openclaw doctor --fix`; der Env-Fallback ist nur für die Notfallwiederherstellung beim Start gedacht, während die Migration ausgerollt wird.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Die Marketplace-Liste akzeptiert einen lokalen Marketplace-Pfad, einen `marketplace.json`-Pfad, eine GitHub-Kurzform wie `owner/repo`, eine GitHub-Repo-URL oder eine Git-URL. `--json` gibt das aufgelöste Quelllabel sowie das geparste Marketplace-Manifest und die Plugin-Einträge aus.

## Verwandt

- [Plugins erstellen](/de/plugins/building-plugins)
- [CLI-Referenz](/de/cli)
- [Community-Plugins](/de/plugins/community)
