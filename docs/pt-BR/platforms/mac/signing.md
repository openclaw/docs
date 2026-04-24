---
read_when:
    - Gerando ou assinando builds de depuração do Mac
summary: Etapas de assinatura para builds de depuração do macOS gerados por scripts de empacotamento
title: Assinatura do macOS
x-i18n:
    generated_at: "2026-04-24T06:01:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: cdd432c1f87ea14f4e19b1e5db967a62b42e2e4118fbd2a44d358b4eedea799f
    source_path: platforms/mac/signing.md
    workflow: 15
---

# Assinatura do mac (builds de depuração)

Este app normalmente é gerado a partir de [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh), que agora:

- define um identificador de bundle estável de depuração: `ai.openclaw.mac.debug`
- grava o Info.plist com esse bundle id (sobrescreva via `BUNDLE_ID=...`)
- chama [`scripts/codesign-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/codesign-mac-app.sh) para assinar o binário principal e o bundle do app para que o macOS trate cada rebuild como o mesmo bundle assinado e mantenha permissões TCC (notificações, acessibilidade, gravação de tela, microfone, fala). Para permissões estáveis, use uma identidade de assinatura real; assinatura ad-hoc é opt-in e frágil (consulte [macOS permissions](/pt-BR/platforms/mac/permissions)).
- usa `CODESIGN_TIMESTAMP=auto` por padrão; isso habilita timestamps confiáveis para assinaturas Developer ID. Defina `CODESIGN_TIMESTAMP=off` para ignorar timestamping (builds de depuração offline).
- injeta metadados de build no Info.plist: `OpenClawBuildTimestamp` (UTC) e `OpenClawGitCommit` (hash curto) para que o painel About possa mostrar build, git e canal de depuração/release.
- **O empacotamento usa Node 24 por padrão**: o script executa builds TS e o build da Control UI. Node 22 LTS, atualmente `22.14+`, continua compatível por compatibilidade.
- lê `SIGN_IDENTITY` do ambiente. Adicione `export SIGN_IDENTITY="Apple Development: Your Name (TEAMID)"` (ou seu certificado Developer ID Application) ao rc do seu shell para sempre assinar com seu certificado. Assinatura ad-hoc exige adesão explícita via `ALLOW_ADHOC_SIGNING=1` ou `SIGN_IDENTITY="-"` (não recomendado para testes de permissão).
- executa uma auditoria de Team ID após a assinatura e falha se qualquer Mach-O dentro do bundle do app estiver assinado por um Team ID diferente. Defina `SKIP_TEAM_ID_CHECK=1` para ignorar.

## Uso

```bash
# da raiz do repositório
scripts/package-mac-app.sh               # seleciona identidade automaticamente; gera erro se nenhuma for encontrada
SIGN_IDENTITY="Developer ID Application: Your Name" scripts/package-mac-app.sh   # certificado real
ALLOW_ADHOC_SIGNING=1 scripts/package-mac-app.sh    # ad-hoc (as permissões não persistirão)
SIGN_IDENTITY="-" scripts/package-mac-app.sh        # ad-hoc explícito (mesma observação)
DISABLE_LIBRARY_VALIDATION=1 scripts/package-mac-app.sh   # solução temporária apenas para dev para incompatibilidade de Team ID do Sparkle
```

### Observação sobre assinatura ad-hoc

Ao assinar com `SIGN_IDENTITY="-"` (ad-hoc), o script desabilita automaticamente o **Hardened Runtime** (`--options runtime`). Isso é necessário para evitar falhas quando o app tenta carregar frameworks embutidos (como Sparkle) que não compartilham o mesmo Team ID. Assinaturas ad-hoc também quebram a persistência de permissões TCC; consulte [macOS permissions](/pt-BR/platforms/mac/permissions) para etapas de recuperação.

## Metadados de build para About

`package-mac-app.sh` marca o bundle com:

- `OpenClawBuildTimestamp`: UTC ISO8601 no momento do empacotamento
- `OpenClawGitCommit`: hash git curto (ou `unknown` se indisponível)

A aba About lê essas chaves para mostrar versão, data de build, commit git e se é um build de depuração (via `#if DEBUG`). Execute o empacotador para atualizar esses valores após mudanças de código.

## Por quê

Permissões TCC estão vinculadas ao identificador do bundle _e_ à assinatura de código. Builds de depuração sem assinatura com UUIDs variáveis faziam o macOS esquecer concessões após cada rebuild. Assinar os binários (ad‑hoc por padrão) e manter bundle id/caminho fixos (`dist/OpenClaw.app`) preserva as permissões entre builds, correspondendo à abordagem do VibeTunnel.

## Relacionados

- [macOS app](/pt-BR/platforms/macos)
- [macOS permissions](/pt-BR/platforms/mac/permissions)
