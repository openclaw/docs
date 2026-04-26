---
read_when:
    - Atualizando o OpenClaw
    - Algo quebra após uma atualização
summary: Atualizando o OpenClaw com segurança (instalação global ou código-fonte), além da estratégia de rollback
title: Atualizando
x-i18n:
    generated_at: "2026-04-26T11:32:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: e40ff4d2db5f0b75107894d2b4959f34f3077acb55045230fb104b95795d9149
    source_path: install/updating.md
    workflow: 15
---

Mantenha o OpenClaw atualizado.

## Recomendado: `openclaw update`

A forma mais rápida de atualizar. Ele detecta seu tipo de instalação (npm ou git), busca a versão mais recente, executa `openclaw doctor` e reinicia o Gateway.

```bash
openclaw update
```

Para trocar de canal ou escolher uma versão específica:

```bash
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag main
openclaw update --dry-run   # visualiza sem aplicar
```

`--channel beta` dá preferência ao beta, mas o runtime recorre a stable/latest quando
a tag beta está ausente ou é mais antiga que a versão estável mais recente. Use `--tag beta`
se quiser a dist-tag beta bruta do npm para uma atualização pontual do pacote.

Veja [Canais de desenvolvimento](/pt-BR/install/development-channels) para a semântica dos canais.

## Alternar entre instalações npm e git

Use canais quando quiser mudar o tipo de instalação. O atualizador mantém seu
estado, config, credenciais e workspace em `~/.openclaw`; ele muda apenas
qual instalação de código do OpenClaw a CLI e o Gateway usam.

```bash
# instalação do pacote npm -> checkout git editável
openclaw update --channel dev

# checkout git -> instalação do pacote npm
openclaw update --channel stable
```

Execute primeiro com `--dry-run` para visualizar a troca exata do modo de instalação:

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

O canal `dev` garante um checkout git, compila-o e instala a CLI global
a partir desse checkout. Os canais `stable` e `beta` usam instalações de pacote. Se o
Gateway já estiver instalado, `openclaw update` atualiza os metadados do serviço
e o reinicia, a menos que você passe `--no-restart`.

## Alternativa: executar o instalador novamente

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Adicione `--no-onboard` para ignorar o onboarding. Para forçar um tipo específico de instalação por meio
do instalador, passe `--install-method git --no-onboard` ou
`--install-method npm --no-onboard`.

## Alternativa: npm, pnpm ou bun manualmente

```bash
npm i -g openclaw@latest
```

Quando `openclaw update` gerencia uma instalação global via npm, ele primeiro executa o comando normal
de instalação global. Se esse comando falhar, o OpenClaw tenta novamente uma vez com
`--omit=optional`. Essa nova tentativa ajuda em hosts onde dependências opcionais nativas
não conseguem compilar, mantendo a falha original visível se o fallback também
falhar.

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### Instalações globais com npm e dependências de runtime

O OpenClaw trata instalações globais empacotadas como somente leitura em runtime, mesmo quando o
diretório global do pacote pode ser gravado pelo usuário atual. Dependências de runtime de Plugins incluídos
são preparadas em um diretório de runtime gravável em vez de alterar a
árvore do pacote. Isso evita que `openclaw update` entre em conflito com um Gateway em execução ou
um agente local que esteja reparando dependências de Plugin durante a mesma instalação.

Algumas configurações de npm no Linux instalam pacotes globais em diretórios controlados por root, como
`/usr/lib/node_modules/openclaw`. O OpenClaw oferece suporte a esse layout por meio do
mesmo caminho de preparação externo.

Para unidades systemd reforçadas, defina um diretório de preparação gravável que esteja incluído em
`ReadWritePaths`:

```ini
Environment=OPENCLAW_PLUGIN_STAGE_DIR=/var/lib/openclaw/plugin-runtime-deps
ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
```

Se `OPENCLAW_PLUGIN_STAGE_DIR` não estiver definido, o OpenClaw usa `$STATE_DIRECTORY` quando
o systemd o fornece e, em seguida, recorre a `~/.openclaw/plugin-runtime-deps`.
A etapa de reparo trata esse estágio como uma raiz local de pacote pertencente ao OpenClaw e
ignora configurações de prefix/global do npm do usuário, portanto a config de npm para instalação global não
redireciona dependências de Plugins incluídos para `~/node_modules` nem para a árvore global de pacotes.

Antes de atualizações de pacote e reparos de dependências de runtime incluídas, o OpenClaw tenta fazer uma
verificação, no melhor esforço, de espaço em disco para o volume de destino. Pouco espaço gera um aviso
com o caminho verificado, mas não bloqueia a atualização porque cotas de sistema de arquivos,
snapshots e volumes de rede podem mudar após a verificação. A instalação real do npm,
a cópia e a verificação pós-instalação continuam sendo autoritativas.

### Dependências de runtime de Plugins incluídos

Instalações empacotadas mantêm dependências de runtime de Plugins incluídos fora da árvore de pacote somente leitura. Na inicialização e durante `openclaw doctor --fix`, o OpenClaw repara
dependências de runtime apenas para Plugins incluídos que estão ativos na config, ativos
por configuração legada de canal ou ativados pelo padrão do manifesto incluído.
O estado persistido de auth de canal por si só não aciona o reparo de dependências de
runtime na inicialização do Gateway.

A desativação explícita tem precedência. Um Plugin ou canal desativado não recebe
reparo de dependências de runtime só porque existe no pacote. Plugins externos
e caminhos de carregamento personalizados ainda usam `openclaw plugins install` ou
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

| Canal    | Comportamento                                                                                                  |
| -------- | -------------------------------------------------------------------------------------------------------------- |
| `stable` | Aguarda `stableDelayHours` e depois aplica com jitter determinístico ao longo de `stableJitterHours` (implantação distribuída). |
| `beta`   | Verifica a cada `betaCheckIntervalHours` (padrão: a cada hora) e aplica imediatamente.                         |
| `dev`    | Não aplica automaticamente. Use `openclaw update` manualmente.                                                |

O Gateway também registra uma dica de atualização na inicialização (desative com `update.checkOnStart: false`).

## Depois de atualizar

<Steps>

### Executar doctor

```bash
openclaw doctor
```

Migra a config, audita políticas de DM e verifica a integridade do Gateway. Detalhes: [Doctor](/pt-BR/gateway/doctor)

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
- Para `openclaw update --channel dev` em checkouts de código-fonte, o atualizador inicializa automaticamente o `pnpm` quando necessário. Se você vir um erro de bootstrap de pnpm/corepack, instale `pnpm` manualmente (ou reative `corepack`) e execute a atualização novamente.
- Consulte: [Solução de problemas](/pt-BR/gateway/troubleshooting)
- Peça ajuda no Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## Relacionado

- [Visão geral da instalação](/pt-BR/install) — todos os métodos de instalação
- [Doctor](/pt-BR/gateway/doctor) — verificações de integridade após atualizações
- [Migrando](/pt-BR/install/migrating) — guias de migração entre versões principais
