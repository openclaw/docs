---
read_when:
    - Configurando uma nova máquina
    - Você quer o que há de mais recente e melhor sem comprometer sua configuração pessoal
summary: Configuração avançada e fluxos de trabalho de desenvolvimento para o OpenClaw
title: Configuração
x-i18n:
    generated_at: "2026-07-12T15:39:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: cd35e9ab99de49a14f3d8673b2d11abe46aace18cc7edac43987826bbd1fd857
    source_path: start/setup.md
    workflow: 16
---

<Note>
Se você está configurando pela primeira vez, comece por [Primeiros passos](/pt-BR/start/getting-started).
Para obter detalhes sobre a integração inicial, consulte [Integração inicial (CLI)](/pt-BR/start/wizard).
</Note>

## Resumo

Escolha um fluxo de configuração com base na frequência com que deseja receber atualizações e se deseja executar o Gateway por conta própria:

- **A personalização fica fora do repositório:** mantenha sua configuração e seu espaço de trabalho em `~/.openclaw/openclaw.json` e `~/.openclaw/workspace/` para que as atualizações do repositório não os afetem.
- **Fluxo estável (recomendado para a maioria):** instale o aplicativo para macOS e deixe que ele execute o Gateway incluído.
- **Fluxo de ponta (desenvolvimento):** execute o Gateway por conta própria com `pnpm gateway:watch` e deixe o aplicativo para macOS se conectar no modo Local.

## Pré-requisitos (a partir do código-fonte)

- Node 24 recomendado (Node 22 LTS, atualmente `22.19+`, ainda é compatível)
- `pnpm` é obrigatório para checkouts do código-fonte. O OpenClaw carrega os plugins incluídos dos pacotes do espaço de trabalho pnpm
  `extensions/*` no modo de desenvolvimento, portanto, executar `npm install` na raiz
  não prepara toda a árvore do código-fonte.
- Docker (opcional; somente para configuração em contêineres/e2e — consulte [Docker](/pt-BR/install/docker))

## Estratégia de personalização (para que as atualizações não causem problemas)

Se você quer algo "100% personalizado para mim" _e_ atualizações fáceis, mantenha sua personalização em:

- **Configuração:** `~/.openclaw/openclaw.json` (semelhante a JSON/JSON5)
- **Espaço de trabalho:** `~/.openclaw/workspace` (Skills, prompts, memórias; transforme-o em um repositório git privado)

Inicialize as pastas de configuração/espaço de trabalho uma vez, sem executar o assistente completo de integração inicial:

```bash
openclaw setup --baseline
```

Ainda não há uma instalação global? Em vez disso, execute a partir deste repositório:

```bash
pnpm openclaw setup --baseline
```

(`openclaw setup` sem `--baseline` é um alias para `openclaw onboard` e executa o assistente interativo completo.)

## Executar o Gateway a partir deste repositório

Depois de `pnpm build`, você pode executar diretamente a CLI empacotada:

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## Fluxo estável (aplicativo para macOS primeiro)

1. Instale e inicie o **OpenClaw.app** (barra de menus).
2. Conclua a lista de verificação de integração inicial/permissões (solicitações do TCC).
3. Verifique se o Gateway está no modo **Local** e em execução (o aplicativo o gerencia).
4. Vincule os canais (exemplo: WhatsApp):

```bash
openclaw channels login
```

5. Faça uma verificação rápida:

```bash
openclaw health
```

Se a integração inicial não estiver disponível na sua compilação:

- Execute `openclaw setup`, depois `openclaw channels login` e, em seguida, inicie o Gateway manualmente (`openclaw gateway`).

## Fluxo de ponta (Gateway em um terminal)

Objetivo: trabalhar no Gateway TypeScript, obter recarregamento automático e manter a interface do aplicativo para macOS conectada.

### 0) (Opcional) Executar também o aplicativo para macOS a partir do código-fonte

Se você também quiser o aplicativo para macOS na versão de ponta:

```bash
./scripts/restart-mac.sh
```

### 1) Iniciar o Gateway de desenvolvimento

```bash
pnpm install
# Somente na primeira execução (ou após redefinir a configuração/espaço de trabalho local do OpenClaw)
pnpm openclaw setup
pnpm gateway:watch
```

`gateway:watch` inicia ou reinicia o processo de observação do Gateway em uma sessão nomeada do tmux
(`openclaw-gateway-watch-main`) e se conecta automaticamente a partir de terminais
interativos. Shells não interativos permanecem desconectados e exibem
`tmux attach -t openclaw-gateway-watch-main`; use
`OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch` para manter uma execução interativa
desconectada ou `pnpm gateway:watch:raw` para usar o modo de observação em primeiro plano. O observador
recarrega quando há alterações relevantes no código-fonte, na configuração e nos metadados dos plugins incluídos. Se o
Gateway observado encerrar durante a inicialização, `gateway:watch` executará
`openclaw doctor --fix --non-interactive` uma vez e tentará novamente; defina
`OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` para desativar essa etapa de reparo exclusiva do desenvolvimento.
`pnpm gateway:watch` não recompila `dist/control-ui`, portanto execute novamente `pnpm ui:build` após alterações em `ui/` ou use `pnpm ui:dev` durante o desenvolvimento da interface de controle.

### 2) Direcionar o aplicativo para macOS ao Gateway em execução

No **OpenClaw.app**:

- Connection Mode: **Local**
  O aplicativo se conectará ao gateway em execução na porta configurada.

### 3) Verificar

- O status do Gateway no aplicativo deve exibir **"Using existing gateway …"**
- Ou pela CLI:

```bash
openclaw health
```

### Armadilhas comuns

- **Porta incorreta:** o WebSocket do Gateway usa `ws://127.0.0.1:18789` por padrão; mantenha o aplicativo e a CLI na mesma porta.
- **Onde o estado fica armazenado:**
  - Estado dos canais/provedores: `~/.openclaw/credentials/`
  - Perfis de autenticação de modelos: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - Sessões e transcrições: `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
  - Artefatos de sessão legados/arquivados: `~/.openclaw/agents/<agentId>/sessions/`
  - Logs: `/tmp/openclaw/`

## Mapa de armazenamento de credenciais

Use estas informações ao depurar a autenticação ou decidir o que incluir no backup:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Token do bot do Telegram**: configuração/variável de ambiente ou `channels.telegram.tokenFile` (somente arquivo comum; links simbólicos são rejeitados)
- **Token do bot do Discord**: configuração/variável de ambiente ou SecretRef (provedores de variável de ambiente/arquivo/execução)
- **Tokens do Slack**: configuração/variável de ambiente (`channels.slack.*`)
- **Listas de permissões de pareamento**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (conta padrão)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (contas que não são padrão)
- **Perfis de autenticação de modelos**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **Conteúdo de segredos baseado em arquivo (opcional)**: `~/.openclaw/secrets.json`
- **Importação OAuth legada**: `~/.openclaw/credentials/oauth.json`
  Mais detalhes: [Segurança](/pt-BR/gateway/security#credential-storage-map).

## Atualização (sem prejudicar sua configuração)

- Mantenha `~/.openclaw/workspace` e `~/.openclaw/` como "seus arquivos"; não coloque prompts/configurações pessoais no repositório `openclaw`.
- Para atualizar o código-fonte: `git pull` + `pnpm install` + continue usando `pnpm gateway:watch`.

## Linux (serviço de usuário do systemd)

As instalações no Linux usam um serviço de **usuário** do systemd. Por padrão, o systemd interrompe os
serviços de usuário ao encerrar a sessão/ficar ocioso, o que encerra o Gateway. A integração inicial tenta habilitar
a permanência para você (pode solicitar sudo). Se ela ainda estiver desativada, execute:

```bash
sudo loginctl enable-linger $USER
```

Para servidores sempre ativos ou com vários usuários, considere usar um serviço de **sistema** em vez de um
serviço de usuário (não é necessário habilitar a permanência). Consulte o [Guia operacional do Gateway](/pt-BR/gateway) para ver as observações sobre o systemd.

## Documentação relacionada

- [Guia operacional do Gateway](/pt-BR/gateway) (opções, supervisão, portas)
- [Configuração do Gateway](/pt-BR/gateway/configuration) (esquema de configuração + exemplos)
- [Discord](/pt-BR/channels/discord) e [Telegram](/pt-BR/channels/telegram) (tags de resposta + configurações de replyToMode)
- [Configuração do assistente OpenClaw](/pt-BR/start/openclaw)
- [Aplicativo para macOS](/pt-BR/platforms/macos) (ciclo de vida do gateway)
