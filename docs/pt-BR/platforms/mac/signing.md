---
read_when:
    - Criando ou assinando compilações de depuração para Mac
summary: Etapas de assinatura para builds de depuração do macOS geradas por scripts de empacotamento
title: Assinatura para macOS
x-i18n:
    generated_at: "2026-05-06T09:05:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 08a2f18f0f813c0bb7352b393531ad69d24da55de2e6ec6446febe0661eb4598
    source_path: platforms/mac/signing.md
    workflow: 16
---

# assinatura no mac (builds de depuração)

Este app normalmente é criado a partir de [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh), que agora:

- define um identificador de bundle de depuração estável: `ai.openclaw.mac.debug`
- grava o Info.plist com esse id de bundle (sobrescreva via `BUNDLE_ID=...`)
- chama [`scripts/codesign-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/codesign-mac-app.sh) para assinar o binário principal e o bundle do app, para que o macOS trate cada rebuild como o mesmo bundle assinado e mantenha as permissões TCC (notificações, acessibilidade, gravação de tela, microfone, fala). Para permissões estáveis, use uma identidade de assinatura real; ad-hoc é opt-in e frágil (veja [permissões do macOS](/pt-BR/platforms/mac/permissions)).
- usa `CODESIGN_TIMESTAMP=auto` por padrão; isso habilita timestamps confiáveis para assinaturas Developer ID. Defina `CODESIGN_TIMESTAMP=off` para pular o timestamping (builds de depuração offline).
- injeta metadados de build no Info.plist: `OpenClawBuildTimestamp` (UTC) e `OpenClawGitCommit` (hash curto), para que o painel Sobre possa mostrar build, git e canal de depuração/release.
- **O empacotamento usa Node 24 por padrão**: o script executa builds TS e o build da Control UI. Node 22 LTS, atualmente `22.14+`, continua compatível.
- lê `SIGN_IDENTITY` do ambiente. Adicione `export SIGN_IDENTITY="Apple Development: Your Name (TEAMID)"` (ou seu certificado Developer ID Application) ao rc do seu shell para sempre assinar com seu certificado. Assinatura ad-hoc exige opt-in explícito via `ALLOW_ADHOC_SIGNING=1` ou `SIGN_IDENTITY="-"` (não recomendado para testes de permissão).
- executa uma auditoria de Team ID após a assinatura e falha se qualquer Mach-O dentro do bundle do app estiver assinado por um Team ID diferente. Defina `SKIP_TEAM_ID_CHECK=1` para ignorar.

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

Ao assinar com `SIGN_IDENTITY="-"` (ad-hoc), o script desabilita automaticamente o **Hardened Runtime** (`--options runtime`). Isso é necessário para evitar falhas quando o app tenta carregar frameworks embutidos (como Sparkle) que não compartilham o mesmo Team ID. Assinaturas ad-hoc também quebram a persistência de permissões TCC; veja [permissões do macOS](/pt-BR/platforms/mac/permissions) para etapas de recuperação.

## Metadados de build para Sobre

`package-mac-app.sh` marca o bundle com:

- `OpenClawBuildTimestamp`: UTC ISO8601 no momento do pacote
- `OpenClawGitCommit`: hash git curto (ou `unknown` se indisponível)

A aba Sobre lê essas chaves para mostrar versão, data de build, commit git e se é um build de depuração (via `#if DEBUG`). Execute o empacotador para atualizar esses valores após alterações no código.

## Por quê

As permissões TCC estão vinculadas ao identificador do bundle _e_ à assinatura de código. Builds de depuração não assinados com UUIDs variáveis faziam o macOS esquecer as concessões após cada rebuild. Assinar os binários (ad-hoc por padrão) e manter um id/caminho de bundle fixo (`dist/OpenClaw.app`) preserva as concessões entre builds, correspondendo à abordagem do VibeTunnel.

## Relacionados

- [app macOS](/pt-BR/platforms/macos)
- [permissões do macOS](/pt-BR/platforms/mac/permissions)
