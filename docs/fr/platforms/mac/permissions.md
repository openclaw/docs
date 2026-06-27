---
read_when:
    - Débogage des invites d’autorisation macOS manquantes ou bloquées
    - Décider d’accorder ou non l’accessibilité à Node ou à un runtime CLI
    - Empaqueter ou signer l’application macOS
    - Modification des identifiants de bundle ou des chemins d’installation de l’application
summary: Persistance des autorisations macOS (TCC) et exigences de signature
title: Autorisations macOS
x-i18n:
    generated_at: "2026-06-27T17:43:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7b7e21c53bff16c3023e2b6509894717c3d0ef96524951b0d0c5975d2fc91019
    source_path: platforms/mac/permissions.md
    workflow: 16
---

Les autorisations macOS sont fragiles. TCC associe une autorisation à la
signature de code de l’application, à l’identifiant de bundle et au chemin sur le disque. Si l’un de ces éléments change,
macOS considère l’application comme nouvelle et peut supprimer ou masquer les invites.

## Exigences pour des autorisations stables

- Même chemin : exécutez l’application depuis un emplacement fixe (pour OpenClaw, `dist/OpenClaw.app`).
- Même identifiant de bundle : modifier l’ID de bundle crée une nouvelle identité d’autorisation.
- Application signée : les builds non signés ou signés ad hoc ne conservent pas les autorisations.
- Signature cohérente : utilisez un vrai certificat Apple Development ou Developer ID
  afin que la signature reste stable entre les rebuilds.

Les signatures ad hoc génèrent une nouvelle identité à chaque build. macOS oubliera les
autorisations précédentes, et les invites peuvent disparaître entièrement jusqu’à ce que les entrées obsolètes soient supprimées.

## Autorisations d’accessibilité pour les runtimes Node et CLI

Préférez accorder l’Accessibilité à OpenClaw.app, Peekaboo.app ou à un autre
assistant signé avec son propre identifiant de bundle plutôt qu’à un binaire `node` générique.

macOS TCC accorde l’Accessibilité à l’identité de code du processus qu’il voit. Si un
workflow Homebrew, nvm, pnpm ou npm conduit un exécutable `node` partagé à
recevoir l’Accessibilité, tout package JavaScript lancé via ce même
exécutable peut hériter de privilèges d’automatisation de l’interface graphique.

Considérez une entrée `node` dans Réglages Système comme une autorisation étendue pour ce runtime Node,
et non comme une autorisation pour un seul package npm. Évitez d’accorder l’Accessibilité à
`node` sauf si vous faites confiance à chaque script et package lancé via cette installation
Node exacte.

Si vous avez accidentellement accordé l’Accessibilité à `node`, supprimez cette entrée dans
Réglages Système -> Confidentialité et sécurité -> Accessibilité. Accordez ensuite l’autorisation à l’application
ou à l’assistant signé qui doit gérer l’automatisation de l’interface utilisateur.

## Liste de récupération lorsque les invites disparaissent

1. Quittez l’application.
2. Supprimez l’entrée de l’application dans Réglages Système -> Confidentialité et sécurité.
3. Relancez l’application depuis le même chemin et accordez à nouveau les autorisations.
4. Si l’invite n’apparaît toujours pas, réinitialisez les entrées TCC avec `tccutil` et réessayez.
5. Certaines autorisations ne réapparaissent qu’après un redémarrage complet de macOS.

Exemples de réinitialisations (remplacez l’ID de bundle si nécessaire) :

```bash
sudo tccutil reset Accessibility ai.openclaw.mac
sudo tccutil reset ScreenCapture ai.openclaw.mac
sudo tccutil reset AppleEvents
```

## Autorisations des fichiers et dossiers (Bureau/Documents/Téléchargements)

macOS peut aussi restreindre l’accès au Bureau, aux Documents et aux Téléchargements pour les processus de terminal ou d’arrière-plan. Si les lectures de fichiers ou les listages de répertoires se bloquent, accordez l’accès au même contexte de processus que celui qui effectue les opérations sur les fichiers (par exemple Terminal/iTerm, une application lancée par LaunchAgent ou un processus SSH).

Solution de contournement : déplacez les fichiers dans l’espace de travail OpenClaw (`~/.openclaw/workspace`) si vous voulez éviter les autorisations dossier par dossier.

Si vous testez les autorisations, signez toujours avec un vrai certificat. Les builds ad hoc
ne sont acceptables que pour des exécutions locales rapides où les autorisations n’ont pas d’importance.

## Connexe

- [Application macOS](/fr/platforms/macos)
- [Signature macOS](/fr/platforms/mac/signing)
