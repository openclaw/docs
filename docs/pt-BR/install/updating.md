---
read_when:
    - Atualizando o OpenClaw
    - Algo deixa de funcionar após uma atualização
summary: Atualizando o OpenClaw com segurança (instalação global ou a partir do código-fonte), além da estratégia de reversão
title: Atualizando
x-i18n:
    generated_at: "2026-04-30T09:56:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 17d4839002b153976e014e0eefcb44f92dcb9bb45b81bf30efb1e8e8c0f30ec3
    source_path: install/updating.md
    workflow: 16
---

Mantenha o OpenClaw atualizado.

## Recomendado: `openclaw update`

A forma mais rápida de atualizar. Ele detecta seu tipo de instalação (npm ou git), busca a versão mais recente, executa `openclaw doctor` e reinicia o Gateway.

```bash
openclaw update
```

Para trocar de canais ou mirar uma versão específica:

```bash
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag main
openclaw update --dry-run   # pré-visualizar sem aplicar
```

`--channel beta` prefere beta, mas o runtime volta para estável/mais recente quando
a tag beta está ausente ou é mais antiga do que a versão estável mais recente. Use `--tag beta`
se você quiser a dist-tag beta bruta do npm para uma atualização pontual de pacote.

Consulte [Canais de desenvolvimento](/pt-BR/install/development-channels) para a semântica dos canais.

## Alternar entre instalações npm e git

Use canais quando quiser mudar o tipo de instalação. O atualizador mantém seu
estado, configuração, credenciais e workspace em `~/.openclaw`; ele só altera
qual instalação de código do OpenClaw a CLI e o Gateway usam.

```bash
# instalação de pacote npm -> checkout git editável
openclaw update --channel dev

# checkout git -> instalação de pacote npm
openclaw update --channel stable
```

Execute primeiro com `--dry-run` para pré-visualizar a troca exata de modo de instalação:

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

O canal `dev` garante um checkout git, compila-o e instala a CLI global
a partir desse checkout. Os canais `stable` e `beta` usam instalações de pacote. Se o
Gateway já estiver instalado, `openclaw update` atualiza os metadados do serviço
e o reinicia, a menos que você passe `--no-restart`.

## Alternativa: executar novamente o instalador

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Adicione `--no-onboard` para pular o onboarding. Para forçar um tipo de instalação específico pelo
instalador, passe `--install-method git --no-onboard` ou
`--install-method npm --no-onboard`.

Se `openclaw update` falhar após a fase de instalação do pacote npm, execute novamente o
instalador. O instalador não chama o atualizador antigo; ele executa diretamente a
instalação global do pacote e pode recuperar uma instalação npm parcialmente atualizada.

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
```

Para fixar a recuperação em uma versão ou dist-tag específica, adicione `--version`:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm --version <version-or-dist-tag>
```

## Alternativa: npm, pnpm ou bun manual

```bash
npm i -g openclaw@latest
```

Quando `openclaw update` gerencia uma instalação npm global, ele instala o alvo
primeiro em um prefixo npm temporário, verifica o inventário `dist` empacotado e depois troca
a árvore de pacote limpa para o prefixo global real. Isso evita que o npm sobreponha um
novo pacote sobre arquivos obsoletos do pacote antigo. Se o comando de instalação falhar,
o OpenClaw tenta novamente uma vez com `--omit=optional`. Essa nova tentativa ajuda hosts em que dependências
opcionais nativas não conseguem compilar, mantendo a falha original visível
se o fallback também falhar.

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### Tópicos avançados de instalação npm

<AccordionGroup>
  <Accordion title="Árvore de pacotes somente leitura">
    O OpenClaw trata instalações globais empacotadas como somente leitura em runtime, mesmo quando o diretório global de pacotes pode ser escrito pelo usuário atual. As dependências de runtime de Plugins empacotados são preparadas em um diretório de runtime gravável, em vez de modificar a árvore de pacotes. Isso impede que `openclaw update` concorra com um Gateway em execução ou um agente local que esteja reparando dependências de Plugins durante a mesma instalação.

    Algumas configurações npm no Linux instalam pacotes globais em diretórios pertencentes ao root, como `/usr/lib/node_modules/openclaw`. O OpenClaw oferece suporte a esse layout pelo mesmo caminho externo de preparação.

  </Accordion>
  <Accordion title="Unidades systemd reforçadas">
    Defina um diretório de preparação gravável que esteja incluído em `ReadWritePaths`:

    ```ini
    Environment=OPENCLAW_PLUGIN_STAGE_DIR=/var/lib/openclaw/plugin-runtime-deps
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

    `OPENCLAW_PLUGIN_STAGE_DIR` também aceita uma lista de caminhos. O OpenClaw resolve dependências de runtime de Plugins empacotados da esquerda para a direita nas raízes listadas, trata raízes anteriores como camadas pré-instaladas somente leitura e instala ou repara apenas na raiz gravável final:

    ```ini
    Environment=OPENCLAW_PLUGIN_STAGE_DIR=/opt/openclaw/plugin-runtime-deps:/var/lib/openclaw/plugin-runtime-deps
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

    Se `OPENCLAW_PLUGIN_STAGE_DIR` não estiver definido, o OpenClaw usa `$STATE_DIRECTORY` quando o systemd o fornece e então recorre a `~/.openclaw/plugin-runtime-deps`. A etapa de reparo trata essa preparação como uma raiz local de pacotes pertencente ao OpenClaw e ignora o prefixo npm do usuário e as configurações globais, portanto a configuração npm de instalação global não redireciona dependências de Plugins empacotados para `~/node_modules` nem para a árvore global de pacotes.

  </Accordion>
  <Accordion title="Verificação preliminar de espaço em disco">
    Antes de atualizações de pacote e reparos de dependências de runtime empacotadas, o OpenClaw tenta uma verificação de espaço em disco de melhor esforço para o volume de destino. Pouco espaço gera um aviso com o caminho verificado, mas não bloqueia a atualização porque cotas de sistema de arquivos, snapshots e volumes de rede podem mudar após a verificação. A instalação npm, a cópia e a verificação pós-instalação reais continuam sendo a autoridade.
  </Accordion>
  <Accordion title="Dependências de runtime de Plugins empacotados">
    Instalações empacotadas mantêm dependências de runtime de Plugins empacotados fora da árvore de pacotes somente leitura. Na inicialização e durante `openclaw doctor --fix`, o OpenClaw repara dependências de runtime apenas para Plugins empacotados que estejam ativos na configuração, ativos por configuração legada de canal ou habilitados pelo padrão do manifesto empacotado. O estado persistido de autenticação de canal sozinho não aciona reparo de dependências de runtime na inicialização do Gateway.

    Desabilitação explícita vence. Um Plugin ou canal desabilitado não tem suas dependências de runtime reparadas só porque existe no pacote. Plugins externos e caminhos de carregamento personalizados ainda usam `openclaw plugins install` ou `openclaw plugins update`.

  </Accordion>
</AccordionGroup>

## Atualizador automático

O atualizador automático fica desativado por padrão. Habilite-o em `~/.openclaw/openclaw.json`:

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

| Canal    | Comportamento                                                                                                 |
| -------- | ------------------------------------------------------------------------------------------------------------- |
| `stable` | Aguarda `stableDelayHours` e então aplica com jitter determinístico ao longo de `stableJitterHours` (implantação distribuída). |
| `beta`   | Verifica a cada `betaCheckIntervalHours` (padrão: a cada hora) e aplica imediatamente.                        |
| `dev`    | Sem aplicação automática. Use `openclaw update` manualmente.                                                  |

O Gateway também registra uma dica de atualização na inicialização (desabilite com `update.checkOnStart: false`).
Para downgrade ou recuperação de incidente, defina `OPENCLAW_NO_AUTO_UPDATE=1` no ambiente do Gateway para bloquear aplicações automáticas mesmo quando `update.auto.enabled` estiver configurado. As dicas de atualização na inicialização ainda podem ser executadas, a menos que `update.checkOnStart` também esteja desabilitado.

## Após atualizar

<Steps>

### Executar doctor

```bash
openclaw doctor
```

Migra configuração, audita políticas de DM e verifica a saúde do Gateway. Detalhes: [Doctor](/pt-BR/gateway/doctor)

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

<Tip>
`npm view openclaw version` mostra a versão publicada atual.
</Tip>

### Fixar um commit (código-fonte)

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

Para voltar à mais recente: `git checkout main && git pull`.

## Se você estiver travado

- Execute `openclaw doctor` novamente e leia a saída com atenção.
- Para `openclaw update --channel dev` em checkouts de código-fonte, o atualizador inicializa automaticamente o `pnpm` quando necessário. Se você vir um erro de inicialização de pnpm/corepack, instale o `pnpm` manualmente (ou reabilite o `corepack`) e execute a atualização novamente.
- Verifique: [Solução de problemas](/pt-BR/gateway/troubleshooting)
- Pergunte no Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## Relacionado

- [Visão geral da instalação](/pt-BR/install): todos os métodos de instalação.
- [Doctor](/pt-BR/gateway/doctor): verificações de saúde após atualizações.
- [Migração](/pt-BR/install/migrating): guias de migração de versão principal.
