---
read_when:
    - Collecte des journaux macOS ou investigation de la journalisation de données privées
    - Débogage des problèmes liés au cycle de vie de l’activation vocale et des sessions
summary: 'Journalisation OpenClaw : fichier journal de diagnostic avec rotation + indicateurs de confidentialité du journal unifié'
title: Journalisation sous macOS
x-i18n:
    generated_at: "2026-07-12T15:37:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: ef0fd91bd7fc0a8b5f598cfe8f5de551795a4badd0f6634c5bcbd4f3916bfc64
    source_path: platforms/mac/logging.md
    workflow: 16
---

# Journalisation (macOS)

## Fichier journal de diagnostic avec rotation (volet Debug)

L’application macOS journalise via swift-log (journalisation unifiée par défaut) et peut également écrire dans un fichier journal local avec rotation pour une conservation durable (`DiagnosticsFileLog`).

- Activer : **Debug pane -> Logs -> App logging -> "Write rolling diagnostics log (JSONL)"** (désactivé par défaut).
- Niveau de détail : sélecteur **Debug pane -> Logs -> App logging -> Verbosity**.
- Emplacement : `~/Library/Logs/OpenClaw/diagnostics.jsonl`.
- Rotation : rotation à 5 MB ; jusqu’à 5 sauvegardes portant les suffixes `.1`...`.5` (la plus ancienne est supprimée).
- Effacer : **Debug pane -> Logs -> App logging -> "Clear"** supprime le fichier actif et toutes les sauvegardes.

Considérez ce fichier comme sensible ; ne le partagez pas sans l’avoir examiné.

## Données privées de la journalisation unifiée sur macOS

La journalisation unifiée masque la plupart des charges utiles, sauf si un sous-système active `privacy -off`. Ce comportement est contrôlé par un fichier plist dans `/Library/Preferences/Logging/Subsystems/`, associé au nom du sous-système. Seules les nouvelles entrées de journal prennent en compte cette option ; activez-la donc avant de reproduire un problème. Contexte : [subtilités de confidentialité de la journalisation macOS](https://steipete.me/posts/2025/logging-privacy-shenanigans).

## Activer pour OpenClaw (`ai.openclaw`)

Écrivez d’abord le fichier plist dans un fichier temporaire, puis installez-le de manière atomique en tant que root :

```bash
cat <<'EOF' >/tmp/ai.openclaw.plist
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>DEFAULT-OPTIONS</key>
    <dict>
        <key>Enable-Private-Data</key>
        <true/>
    </dict>
</dict>
</plist>
EOF
sudo install -m 644 -o root -g wheel /tmp/ai.openclaw.plist /Library/Preferences/Logging/Subsystems/ai.openclaw.plist
```

Aucun redémarrage n’est nécessaire ; logd prend rapidement en compte le fichier, mais seules les nouvelles lignes de journal incluent les charges utiles privées. Consultez la sortie plus détaillée avec `./scripts/clawlog.sh --category WebChat --last 5m` (`--last`/`-l` définit la plage temporelle, `5m` par défaut ; `--category`/`-c` filtre par catégorie).

## Désactiver après le débogage

- Supprimez la substitution : `sudo rm /Library/Preferences/Logging/Subsystems/ai.openclaw.plist`.
- Vous pouvez également exécuter `sudo log config --reload` pour forcer logd à abandonner immédiatement la substitution.
- Cette interface peut inclure des numéros de téléphone et le contenu des messages ; ne conservez le fichier plist en place que lorsqu’il est activement nécessaire.

## Pages connexes

- [Application macOS](/fr/platforms/macos)
- [Journalisation du Gateway](/fr/gateway/logging)
