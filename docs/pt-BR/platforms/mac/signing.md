---
read_when:
    - Compilar ou assinar compilações de depuração para Mac
summary: Etapas de assinatura para builds de depuração do macOS gerados por scripts de empacotamento
title: Assinatura do macOS
x-i18n:
    generated_at: "2026-05-07T13:21:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 58a4edd3d0df0d06c6e60251345a8e4a658bc4a3fceb4c01a21a9e98aeabfb6f
    source_path: platforms/mac/signing.md
    workflow: 16
---

# assinatura no mac (compilações de depuração)

Este app normalmente é compilado por [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh), que agora:

- define um identificador de pacote de depuração estável: `ai.openclaw.mac.debug`
- grava o Info.plist com esse id de pacote (sobrescreva via `BUNDLE_ID=...`)
- chama [`scripts/codesign-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/codesign-mac-app.sh) para assinar o binário principal e o pacote do app, para que o macOS trate cada recompilação como o mesmo pacote assinado e mantenha as permissões de TCC (notificações, acessibilidade, gravação de tela, microfone, fala). Para permissões estáveis, use uma identidade de assinatura real; ad-hoc é opcional e frágil (consulte [permissões do macOS](/pt-BR/platforms/mac/permissions)).
- usa `CODESIGN_TIMESTAMP=auto` por padrão; isso habilita timestamps confiáveis para assinaturas Developer ID. Defina `CODESIGN_TIMESTAMP=off` para pular o timestamping (compilações de depuração offline).
- injeta metadados de compilação no Info.plist: `OpenClawBuildTimestamp` (UTC) e `OpenClawGitCommit` (hash curto), para que o painel Sobre possa mostrar compilação, git e canal de depuração/lançamento.
- **O empacotamento usa Node 24 por padrão**: o script executa compilações TS e a compilação da UI de Controle. Node 22 LTS, atualmente `22.16+`, continua compatível.
- lê `SIGN_IDENTITY` do ambiente. Adicione `export SIGN_IDENTITY="Apple Development: Your Name (TEAMID)"` (ou seu certificado Developer ID Application) ao rc do seu shell para sempre assinar com seu certificado. A assinatura ad-hoc exige adesão explícita via `ALLOW_ADHOC_SIGNING=1` ou `SIGN_IDENTITY="-"` (não recomendado para testes de permissões).
- executa uma auditoria de Team ID após a assinatura e falha se qualquer Mach-O dentro do pacote do app estiver assinado por um Team ID diferente. Defina `SKIP_TEAM_ID_CHECK=1` para ignorar.

## Uso

```bash
# from repo root
scripts/package-mac-app.sh               # auto-selects identity; errors if none found
SIGN_IDENTITY="Developer ID Application: Your Name" scripts/package-mac-app.sh   # real cert
ALLOW_ADHOC_SIGNING=1 scripts/package-mac-app.sh    # ad-hoc (permissions will not stick)
SIGN_IDENTITY="-" scripts/package-mac-app.sh        # explicit ad-hoc (same caveat)
DISABLE_LIBRARY_VALIDATION=1 scripts/package-mac-app.sh   # dev-only Sparkle Team ID mismatch workaround
```

### Observação sobre assinatura ad-hoc

Ao assinar com `SIGN_IDENTITY="-"` (ad-hoc), o script desabilita automaticamente o **Runtime Reforçado** (`--options runtime`). Isso é necessário para evitar falhas quando o app tenta carregar frameworks incorporados (como o Sparkle) que não compartilham o mesmo Team ID. Assinaturas ad-hoc também quebram a persistência de permissões de TCC; consulte [permissões do macOS](/pt-BR/platforms/mac/permissions) para etapas de recuperação.

## Metadados de compilação para Sobre

`package-mac-app.sh` carimba o pacote com:

- `OpenClawBuildTimestamp`: UTC ISO8601 no momento do empacotamento
- `OpenClawGitCommit`: hash git curto (ou `unknown` se indisponível)

A aba Sobre lê essas chaves para mostrar versão, data de compilação, commit git e se é uma compilação de depuração (via `#if DEBUG`). Execute o empacotador para atualizar esses valores após alterações no código.

## Por quê

As permissões de TCC estão vinculadas ao identificador do pacote _e_ à assinatura de código. Compilações de depuração não assinadas com UUIDs variáveis faziam o macOS esquecer concessões após cada recompilação. Assinar os binários (ad-hoc por padrão) e manter um id/caminho de pacote fixo (`dist/OpenClaw.app`) preserva as concessões entre compilações, correspondendo à abordagem do VibeTunnel.

## Relacionado

- [app macOS](/pt-BR/platforms/macos)
- [permissões do macOS](/pt-BR/platforms/mac/permissions)
