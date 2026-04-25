---
read_when:
    - Atualizando o OpenClaw
    - Algo quebra após uma atualização
summary: Atualizando o OpenClaw com segurança (instalação global ou a partir da fonte), além de estratégia de rollback
title: Atualizando
x-i18n:
    generated_at: "2026-04-25T13:49:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: af88eaa285145dd5fc370b28c0f9d91069b815c75ec416df726cfce4271a6b54
    source_path: install/updating.md
    workflow: 15
---

Mantenha o OpenClaw atualizado.

## Recomendado: `openclaw update`

A forma mais rápida de atualizar. Ele detecta seu tipo de instalação (npm ou git), busca a versão mais recente, executa `openclaw doctor` e reinicia o gateway.

```bash
openclaw update
```

Para alternar canais ou direcionar para uma versão específica:

```bash
openclaw update --channel beta
openclaw update --tag main
openclaw update --dry-run   # prévia sem aplicar
```

`--channel beta` prefere beta, mas o runtime recorre a stable/latest quando
a tag beta está ausente ou é mais antiga que a versão stable mais recente. Use `--tag beta`
se quiser a dist-tag beta bruta do npm para uma atualização pontual do pacote.

Consulte [Development channels](/pt-BR/install/development-channels) para a semântica dos canais.

## Alternativa: executar novamente o instalador

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Adicione `--no-onboard` para ignorar o onboarding. Para instalações a partir da fonte, passe `--install-method git --no-onboard`.

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

### Instalações globais com npm e dependências de runtime

O OpenClaw trata instalações globais empacotadas como somente leitura em runtime, mesmo quando o
diretório global do pacote é gravável pelo usuário atual. Dependências de runtime de Plugins empacotados
são preparadas em um diretório gravável de runtime em vez de modificar a
árvore do pacote. Isso impede que `openclaw update` entre em corrida com um gateway em execução ou
com um agente local que esteja reparando dependências de Plugin durante a mesma instalação.

Algumas configurações Linux com npm instalam pacotes globais em diretórios pertencentes ao root, como
`/usr/lib/node_modules/openclaw`. O OpenClaw oferece suporte a esse layout pelo
mesmo caminho externo de staging.

Para unidades systemd endurecidas, defina um diretório gravável de staging incluído em
`ReadWritePaths`:

```ini
Environment=OPENCLAW_PLUGIN_STAGE_DIR=/var/lib/openclaw/plugin-runtime-deps
ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
```

Se `OPENCLAW_PLUGIN_STAGE_DIR` não estiver definido, o OpenClaw usa `$STATE_DIRECTORY` quando
o systemd o fornece, e depois recorre a `~/.openclaw/plugin-runtime-deps`.

### Dependências de runtime de Plugins empacotados

Instalações empacotadas mantêm dependências de runtime de Plugins empacotados fora da
árvore de pacote somente leitura. Na inicialização e durante `openclaw doctor --fix`, o OpenClaw repara
dependências de runtime apenas para Plugins empacotados que estejam ativos na configuração, ativos
por configuração legada de canal ou ativados pelo padrão do manifesto empacotado.

A desativação explícita prevalece. Um Plugin ou canal desativado não tem suas
dependências de runtime reparadas apenas porque existe no pacote. Plugins externos
e caminhos personalizados de carregamento ainda usam `openclaw plugins install` ou
`openclaw plugins update`.

## Atualizador automático

O atualizador automático vem desativado por padrão. Ative-o em `~/.openclaw/openclaw.json`:

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
| `stable` | Aguarda `stableDelayHours`, depois aplica com jitter determinístico ao longo de `stableJitterHours` (implantação distribuída). |
| `beta`   | Verifica a cada `betaCheckIntervalHours` (padrão: de hora em hora) e aplica imediatamente.                       |
| `dev`    | Sem aplicação automática. Use `openclaw update` manualmente.                                                      |

O gateway também registra uma dica de atualização na inicialização (desative com `update.checkOnStart: false`).

## Após atualizar

<Steps>

### Executar doctor

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

### Fixar um commit (fonte)

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

Para voltar ao mais recente: `git checkout main && git pull`.

## Se você estiver travado

- Execute `openclaw doctor` novamente e leia a saída com atenção.
- Para `openclaw update --channel dev` em checkouts a partir da fonte, o atualizador inicializa automaticamente o `pnpm` quando necessário. Se você vir um erro de bootstrap de pnpm/corepack, instale `pnpm` manualmente (ou reative o `corepack`) e execute a atualização novamente.
- Consulte: [Troubleshooting](/pt-BR/gateway/troubleshooting)
- Peça ajuda no Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## Relacionado

- [Install Overview](/pt-BR/install) — todos os métodos de instalação
- [Doctor](/pt-BR/gateway/doctor) — verificações de integridade após atualizações
- [Migrating](/pt-BR/install/migrating) — guias de migração de versões principais
