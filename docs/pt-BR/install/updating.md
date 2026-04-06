---
read_when:
    - Atualizando o OpenClaw
    - Algo quebra após uma atualização
summary: Atualizando o OpenClaw com segurança (instalação global ou do código-fonte), além da estratégia de rollback
title: Atualização
x-i18n:
    generated_at: "2026-04-06T03:07:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: ca9fff0776b9f5977988b649e58a5d169e5fa3539261cb02779d724d4ca92877
    source_path: install/updating.md
    workflow: 15
---

# Atualização

Mantenha o OpenClaw atualizado.

## Recomendado: `openclaw update`

A forma mais rápida de atualizar. Ele detecta seu tipo de instalação (npm ou git), busca a versão mais recente, executa `openclaw doctor` e reinicia o gateway.

```bash
openclaw update
```

Para trocar de canal ou direcionar para uma versão específica:

```bash
openclaw update --channel beta
openclaw update --tag main
openclaw update --dry-run   # prévia sem aplicar
```

`--channel beta` dá preferência ao beta, mas o runtime usa fallback para stable/latest quando
a tag beta está ausente ou é mais antiga que a versão estável mais recente. Use `--tag beta`
se você quiser a raw npm beta dist-tag para uma atualização pontual do pacote.

Consulte [Canais de desenvolvimento](/pt-BR/install/development-channels) para a semântica dos canais.

## Alternativa: executar o instalador novamente

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Adicione `--no-onboard` para pular o onboarding. Para instalações a partir do código-fonte, passe `--install-method git --no-onboard`.

## Alternativa: npm, pnpm ou bun manual

```bash
npm i -g openclaw@latest
```

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

## Atualizador automático

O atualizador automático vem desativado por padrão. Habilite-o em `~/.openclaw/openclaw.json`:

```json5
{
  update: {
    channel: "stable",
    auto: {
      enabled: true,
      stableDelayHours: 6,
      stableJitterHours: 12,
      betaCheckIntervalHours: 1,
    },
  },
}
```

| Canal    | Comportamento                                                                                                  |
| -------- | -------------------------------------------------------------------------------------------------------------- |
| `stable` | Aguarda `stableDelayHours`, depois aplica com jitter determinístico ao longo de `stableJitterHours` (rollout distribuído). |
| `beta`   | Verifica a cada `betaCheckIntervalHours` (padrão: a cada hora) e aplica imediatamente.                        |
| `dev`    | Sem aplicação automática. Use `openclaw update` manualmente.                                                   |

O gateway também registra uma dica de atualização na inicialização (desative com `update.checkOnStart: false`).

## Após atualizar

<Steps>

### Executar o doctor

```bash
openclaw doctor
```

Migra a configuração, audita políticas de DM e verifica a integridade do gateway. Detalhes: [Doctor](/pt-BR/gateway/doctor)

### Reiniciar o gateway

```bash
openclaw gateway restart
```

### Verificar

```bash
openclaw health
```

</Steps>

## Rollback

### Fixar uma versão (npm)

```bash
npm i -g openclaw@<version>
openclaw doctor
openclaw gateway restart
```

Dica: `npm view openclaw version` mostra a versão publicada atual.

### Fixar um commit (código-fonte)

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

Para voltar ao mais recente: `git checkout main && git pull`.

## Se você estiver travado

- Execute `openclaw doctor` novamente e leia a saída com atenção.
- Para `openclaw update --channel dev` em checkouts do código-fonte, o atualizador inicializa automaticamente o `pnpm` quando necessário. Se você vir um erro de bootstrap do pnpm/corepack, instale o `pnpm` manualmente (ou reative o `corepack`) e execute a atualização novamente.
- Verifique: [Solução de problemas](/pt-BR/gateway/troubleshooting)
- Peça ajuda no Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## Relacionado

- [Visão geral da instalação](/pt-BR/install) — todos os métodos de instalação
- [Doctor](/pt-BR/gateway/doctor) — verificações de integridade após atualizações
- [Migração](/pt-BR/install/migrating) — guias de migração de versões principais
