---
read_when:
    - Configurando uma nova máquina
    - Você quer o que há de mais recente e melhor sem comprometer sua configuração pessoal
summary: Configuração avançada e fluxos de trabalho de desenvolvimento para o OpenClaw
title: Configuração
x-i18n:
    generated_at: "2026-07-16T12:59:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c40d6d2bf2814465f3cc49c65d4c1498671420af728ce8012d13af3fba67025a
    source_path: start/setup.md
    workflow: 16
---

<Note>
Se você está configurando pela primeira vez, comece por [Primeiros passos](/pt-BR/start/getting-started).
Para obter detalhes sobre a integração inicial, consulte [Integração inicial (CLI)](/pt-BR/start/wizard).
</Note>

## Resumo

Escolha um fluxo de configuração com base na frequência desejada de atualizações e se você mesmo deseja executar o Gateway:

- **As personalizações ficam fora do repositório:** mantenha sua configuração e seu workspace em `~/.openclaw/openclaw.json` e `~/.openclaw/workspace/` para que as atualizações do repositório não os afetem.
- **Fluxo estável (recomendado para a maioria):** instale o aplicativo para macOS e deixe que ele execute o Gateway incluído.
- **Fluxo de última geração (desenvolvimento):** execute o Gateway por conta própria usando `pnpm gateway:watch` e permita que o aplicativo para macOS se conecte no modo Local.

## Pré-requisitos (a partir do código-fonte)

- Node 24.15+ recomendado (Node 22 LTS, atualmente `22.22.3+`, ainda é compatível)
- `pnpm` é necessário para checkouts do código-fonte. O OpenClaw carrega plugins incluídos dos
  pacotes `extensions/*` do workspace pnpm no modo de desenvolvimento, portanto, o `npm install` na raiz
  não prepara toda a árvore do código-fonte.
- Docker (opcional; somente para configuração em contêiner/E2E — consulte [Docker](/pt-BR/install/docker))

## Estratégia de personalização (para que as atualizações não causem problemas)

Se você deseja algo "100% personalizado para mim" _e_ atualizações fáceis, mantenha suas personalizações em:

- **Configuração:** `~/.openclaw/openclaw.json` (JSON/semelhante a JSON5)
- **Workspace:** `~/.openclaw/workspace` (Skills, prompts, memórias; transforme-o em um repositório git privado)

Inicialize as pastas de configuração/workspace uma vez, sem executar o assistente completo de integração inicial:

```bash
openclaw setup --baseline
```

Ainda não há uma instalação global? Em vez disso, execute a partir deste repositório:

```bash
pnpm openclaw setup --baseline
```

(O `openclaw setup` sem `--baseline` é um alias de `openclaw onboard` e executa o assistente interativo completo.)

## Executar o Gateway a partir deste repositório

Após `pnpm build`, você pode executar diretamente a CLI empacotada:

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## Fluxo estável (primeiro o aplicativo para macOS)

1. Instale e inicie o **OpenClaw.app** (barra de menus).
2. Conclua a lista de verificação de integração inicial/permissões (solicitações do TCC).
3. Verifique se o Gateway está em **Local** e em execução (o aplicativo o gerencia).
4. Vincule as plataformas (exemplo: WhatsApp):

```bash
openclaw channels login
```

5. Verificação rápida:

```bash
openclaw health
```

Se a integração inicial não estiver disponível na sua compilação:

- Execute `openclaw setup`, depois `openclaw channels login` e, em seguida, inicie o Gateway manualmente (`openclaw gateway`).

## Fluxo de última geração (Gateway em um terminal)

Objetivo: trabalhar no Gateway TypeScript, obter recarregamento automático e manter conectada a interface do aplicativo para macOS.

### 0) (Opcional) Executar também o aplicativo para macOS a partir do código-fonte

Se você também deseja usar a versão mais recente do aplicativo para macOS:

```bash
./scripts/restart-mac.sh
```

### 1) Iniciar o Gateway de desenvolvimento

```bash
pnpm install
# Somente na primeira execução (ou após redefinir a configuração/workspace local do OpenClaw)
pnpm openclaw setup
pnpm gateway:watch
```

`gateway:watch` inicia ou reinicia o processo de monitoramento do Gateway em uma sessão tmux
nomeada (`openclaw-gateway-watch-main`) e se conecta automaticamente a partir de
terminais interativos. Shells não interativos permanecem desconectados e exibem
`tmux attach -t openclaw-gateway-watch-main`; use
`OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch` para manter desconectada uma execução
interativa ou `pnpm gateway:watch:raw` para o modo de monitoramento em primeiro plano. O monitor
interrompe o serviço instalado do Gateway do perfil ativo antes de assumir sua
porta configurada/padrão, impedindo que o supervisor de serviços substitua o
processo do código-fonte. O serviço permanece instalado; execute `pnpm openclaw gateway start`
quando terminar o monitoramento. O painel do tmux permanece disponível após uma falha na inicialização
para que outro terminal ou agente possa se conectar ou capturar seus logs. O monitor
recarrega quando há alterações relevantes no código-fonte, na configuração e nos metadados dos plugins incluídos. Se o
Gateway monitorado for encerrado durante a inicialização, `gateway:watch` executará
`openclaw doctor --fix --non-interactive` uma vez e tentará novamente; defina
`OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` para desativar essa etapa de reparo exclusiva do desenvolvimento.
`pnpm gateway:watch` não recompila `dist/control-ui`, portanto, execute novamente `pnpm ui:build` após alterações em `ui/` ou use `pnpm ui:dev` ao desenvolver a interface de controle.

### 2) Apontar o aplicativo para macOS para o Gateway em execução

No **OpenClaw.app**:

- Connection Mode: **Local**
  O aplicativo se conectará ao gateway em execução na porta configurada.

### 3) Verificar

- O status do Gateway no aplicativo deve mostrar **"Using existing gateway …"**
- Ou pela CLI:

```bash
openclaw health
```

### Armadilhas comuns

- **Porta incorreta:** o WS do Gateway usa `ws://127.0.0.1:18789` por padrão; mantenha o aplicativo e a CLI na mesma porta.
- **Local do estado:**
  - Estado do canal/provedor: `~/.openclaw/credentials/`
  - Perfis de autenticação do modelo: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - Sessões e transcrições: `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
  - Artefatos de sessão legados/arquivados: `~/.openclaw/agents/<agentId>/sessions/`
  - Logs: `/tmp/openclaw/`

## Mapa de armazenamento de credenciais

Use isto ao depurar a autenticação ou decidir o que incluir no backup:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Token do bot do Telegram**: configuração/ambiente ou `channels.telegram.tokenFile` (somente arquivo comum; links simbólicos são rejeitados)
- **Token do bot do Discord**: configuração/ambiente ou SecretRef (provedores de ambiente/arquivo/execução)
- **Tokens do Slack**: configuração/ambiente (`channels.slack.*`)
- **Listas de permissões de emparelhamento**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (conta padrão)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (contas não padrão)
- **Perfis de autenticação do modelo**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **Payload de segredos baseado em arquivo (opcional)**: `~/.openclaw/secrets.json`
- **Importação de OAuth legado**: `~/.openclaw/credentials/oauth.json`
  Mais detalhes: [Segurança](/pt-BR/gateway/security#credential-storage-map).

## Atualização (sem destruir sua configuração)

- Mantenha `~/.openclaw/workspace` e `~/.openclaw/` como "suas coisas"; não coloque prompts/configurações pessoais no repositório `openclaw`.
- Atualização do código-fonte: `git pull` + `pnpm install` + continue usando `pnpm gateway:watch`.

## Linux (serviço de usuário do systemd)

As instalações no Linux usam um serviço de **usuário** do systemd. Por padrão, o systemd interrompe os
serviços do usuário no logout/por inatividade, o que encerra o Gateway. A integração inicial tenta habilitar
a permanência para você (pode solicitar sudo). Se ela ainda estiver desativada, execute:

```bash
sudo loginctl enable-linger $USER
```

Para servidores sempre ativos ou com vários usuários, considere usar um serviço de **sistema** em vez de um
serviço de usuário (não é necessário habilitar a permanência). Consulte o [manual de operações do Gateway](/pt-BR/gateway) para obter as observações sobre o systemd.

## Documentação relacionada

- [Manual de operações do Gateway](/pt-BR/gateway) (flags, supervisão, portas)
- [Configuração do Gateway](/pt-BR/gateway/configuration) (esquema de configuração + exemplos)
- [Discord](/pt-BR/channels/discord) e [Telegram](/pt-BR/channels/telegram) (tags de resposta + configurações de replyToMode)
- [Configuração do assistente OpenClaw](/pt-BR/start/openclaw)
- [Aplicativo para macOS](/pt-BR/platforms/macos) (ciclo de vida do gateway)
