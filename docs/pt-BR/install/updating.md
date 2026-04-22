---
read_when:
    - Atualizando o OpenClaw
    - Algo quebra após uma atualização
summary: Atualizando o OpenClaw com segurança (instalação global ou a partir do código-fonte), além da estratégia de rollback
title: Atualizando
x-i18n:
    generated_at: "2026-04-22T04:23:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6ab2b515457c64d24c830e2e1678d9fefdcf893e0489f0d99b039db3b877b3c4
    source_path: install/updating.md
    workflow: 15
---

# Atualizando

Mantenha o OpenClaw atualizado.

## Recomendado: `openclaw update`

A forma mais rápida de atualizar. Ele detecta seu tipo de instalação (npm ou git), busca a versão mais recente, executa `openclaw doctor` e reinicia o Gateway.

```bash
openclaw update
```

Para trocar de canal ou direcionar para uma versão específica:

```bash
openclaw update --channel beta
openclaw update --tag main
openclaw update --dry-run   # prévia sem aplicar
```

`--channel beta` prefere beta, mas o runtime recorre para stable/latest quando
a tag beta está ausente ou é mais antiga que a release stable mais recente. Use `--tag beta`
se quiser a dist-tag beta bruta do npm para uma atualização pontual do pacote.

Consulte [Canais de desenvolvimento](/pt-BR/install/development-channels) para a semântica dos canais.

## Alternativa: executar o instalador novamente

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Adicione `--no-onboard` para ignorar o onboarding. Para instalações a partir do código-fonte, passe `--install-method git --no-onboard`.

## Alternativa: npm, pnpm ou bun manualmente

```bash
npm i -g openclaw@latest
```

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### Instalações globais npm pertencentes ao root

Algumas configurações npm no Linux instalam pacotes globais em diretórios pertencentes ao root, como
`/usr/lib/node_modules/openclaw`. O OpenClaw oferece suporte a esse layout: o
pacote instalado é tratado como somente leitura em runtime, e as dependências de runtime
do plugin incluído são preparadas em um diretório de runtime gravável em vez de alterar a
árvore do pacote.

Para unidades systemd endurecidas, defina um diretório de preparação gravável que esteja incluído em
`ReadWritePaths`:

```ini
Environment=OPENCLAW_PLUGIN_STAGE_DIR=/var/lib/openclaw/plugin-runtime-deps
ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
```

Se `OPENCLAW_PLUGIN_STAGE_DIR` não estiver definido, o OpenClaw usa `$STATE_DIRECTORY` quando
o systemd o fornece e, em seguida, recorre a `~/.openclaw/plugin-runtime-deps`.

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

| Canal    | Comportamento                                                                                                     |
| -------- | ----------------------------------------------------------------------------------------------------------------- |
| `stable` | Aguarda `stableDelayHours` e então aplica com jitter determinístico ao longo de `stableJitterHours` (implantação distribuída). |
| `beta`   | Verifica a cada `betaCheckIntervalHours` (padrão: a cada hora) e aplica imediatamente.                           |
| `dev`    | Sem aplicação automática. Use `openclaw update` manualmente.                                                      |

O Gateway também registra uma dica de atualização na inicialização (desabilite com `update.checkOnStart: false`).

## Após atualizar

<Steps>

### Executar doctor

```bash
openclaw doctor
```

Migra a configuração, audita políticas de DM e verifica a integridade do Gateway. Detalhes: [Doctor](/pt-BR/gateway/doctor)

### Reiniciar o Gateway

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

## Se você travar

- Execute `openclaw doctor` novamente e leia a saída com atenção.
- Para `openclaw update --channel dev` em checkouts do código-fonte, o atualizador faz bootstrap automático do `pnpm` quando necessário. Se você vir um erro de bootstrap de pnpm/corepack, instale o `pnpm` manualmente (ou reabilite o `corepack`) e execute a atualização novamente.
- Consulte: [Solução de problemas](/pt-BR/gateway/troubleshooting)
- Pergunte no Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## Relacionado

- [Visão geral da instalação](/pt-BR/install) — todos os métodos de instalação
- [Doctor](/pt-BR/gateway/doctor) — verificações de integridade após atualizações
- [Migração](/pt-BR/install/migrating) — guias de migração de versões principais
