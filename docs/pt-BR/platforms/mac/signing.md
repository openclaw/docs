---
read_when:
    - Compilação ou assinatura de builds de depuração para Mac
summary: Etapas de assinatura para builds de depuração do macOS gerados por scripts de empacotamento
title: assinatura do macOS
x-i18n:
    generated_at: "2026-07-12T15:25:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 663c08c031417d5a9f048581421e4fe9f69480917582f74746af675bcca5cf95
    source_path: platforms/mac/signing.md
    workflow: 16
---

# Assinatura no Mac (builds de depuração)

[`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) compila e empacota o aplicativo em um caminho fixo (`dist/OpenClaw.app`) e, em seguida, chama [`scripts/codesign-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/codesign-mac-app.sh) para assiná-lo. As permissões do TCC estão vinculadas ao ID do pacote e à assinatura de código; manter ambos estáveis (e o aplicativo em um caminho fixo) entre recompilações evita que o macOS esqueça as concessões do TCC (notificações, acessibilidade, gravação de tela, microfone e fala).

- O identificador do pacote de depuração usa `ai.openclaw.mac.debug` por padrão (substitua com `BUNDLE_ID=...`).
- Node: `>=22.19.0 <23` ou `>=23.11.0` (`engines` no `package.json` do repositório). O empacotador também compila a interface de controle (`pnpm ui:build`).
- Por padrão, exige uma identidade de assinatura real; o script de assinatura encerra com erro se nenhuma for encontrada e `ALLOW_ADHOC_SIGNING` não estiver definido. A assinatura ad hoc (`SIGN_IDENTITY="-"`) exige ativação explícita e não mantém as permissões do TCC entre recompilações. Consulte [Permissões do macOS](/pt-BR/platforms/mac/permissions).
- Lê `SIGN_IDENTITY` do ambiente (por exemplo, `export SIGN_IDENTITY="Apple Development: Your Name (TEAMID)"` ou um certificado Developer ID Application). Sem essa variável, `codesign-mac-app.sh` seleciona automaticamente uma identidade nesta ordem: Developer ID Application, Apple Distribution, Apple Development e, por fim, a primeira identidade válida de assinatura de código encontrada.
- `CODESIGN_TIMESTAMP=auto` (padrão) habilita carimbos de data e hora confiáveis somente para assinaturas Developer ID Application. Defina como `on`/`off` para forçar a ativação ou desativação.
- Registra `OpenClawBuildTimestamp` (ISO8601 UTC) e `OpenClawGitCommit` (hash curto; `unknown` se indisponível) no Info.plist para que a aba Sobre possa mostrar o build, o commit do Git e o canal de depuração/lançamento.
- Executa uma auditoria do ID da equipe após a assinatura e falha se qualquer Mach-O dentro do pacote tiver um ID da equipe diferente. Defina `SKIP_TEAM_ID_CHECK=1` para ignorá-la.

## Uso

```bash
# a partir da raiz do repositório
scripts/package-mac-app.sh                                                      # seleciona automaticamente a identidade; gera erro se nenhuma for encontrada
SIGN_IDENTITY="Developer ID Application: Your Name" scripts/package-mac-app.sh   # certificado real
ALLOW_ADHOC_SIGNING=1 scripts/package-mac-app.sh                                 # ad hoc (as permissões não serão mantidas)
SIGN_IDENTITY="-" scripts/package-mac-app.sh                                     # ad hoc explícita (mesma ressalva)
DISABLE_LIBRARY_VALIDATION=1 scripts/package-mac-app.sh                          # solução alternativa somente para desenvolvimento para incompatibilidade do ID da equipe do Sparkle
```

### Observação sobre assinatura ad hoc

`SIGN_IDENTITY="-"` desabilita o Hardened Runtime (`--options runtime`) para evitar falhas quando o aplicativo carrega frameworks incorporados (como o Sparkle) que não compartilham o mesmo ID da equipe. Assinaturas ad hoc também impedem a persistência das permissões do TCC; consulte [Permissões do macOS](/pt-BR/platforms/mac/permissions) para ver as etapas de recuperação.

## Metadados do build para a aba Sobre

A aba Sobre lê `OpenClawBuildTimestamp` e `OpenClawGitCommit` do Info.plist para mostrar a versão, a data do build, o commit do Git e se o build é DEBUG (por meio de `#if DEBUG`). Execute novamente o empacotador após alterações no código para atualizar esses valores.

## Relacionados

- [Aplicativo para macOS](/pt-BR/platforms/macos)
- [Permissões do macOS](/pt-BR/platforms/mac/permissions)
