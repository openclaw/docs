---
read_when:
    - Respondendo a perguntas comuns de configuração, instalação, integração inicial ou suporte em tempo de execução
    - Triagem de problemas relatados por usuários antes de uma depuração mais aprofundada
summary: Perguntas frequentes sobre instalação, configuração e uso do OpenClaw
title: Perguntas frequentes
x-i18n:
    generated_at: "2026-06-27T17:36:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 40b32792c202944576cd983ecf8bf794551bc50986d6b5c985a8ddfe0ecf0b34
    source_path: help/faq.md
    workflow: 16
---

Respostas rápidas e solução de problemas mais aprofundada para configurações reais (desenvolvimento local, VPS, multiagente, OAuth/chaves de API, failover de modelo). Para diagnósticos de runtime, consulte [Solução de problemas](/pt-BR/gateway/troubleshooting). Para a referência completa de configuração, consulte [Configuração](/pt-BR/gateway/configuration).

## Primeiros 60 segundos se algo estiver quebrado

1. **Status rápido (primeira verificação)**

   ```bash
   openclaw status
   ```

   Resumo local rápido: SO + atualização, acessibilidade do gateway/serviço, agentes/sessões, configuração de provedor + problemas de runtime (quando o gateway está acessível).

2. **Relatório colável (seguro para compartilhar)**

   ```bash
   openclaw status --all
   ```

   Diagnóstico somente leitura com cauda de log (tokens ocultados).

3. **Estado do daemon + porta**

   ```bash
   openclaw gateway status
   ```

   Mostra runtime do supervisor vs acessibilidade RPC, a URL de destino da sondagem e qual configuração o serviço provavelmente usou.

4. **Sondagens profundas**

   ```bash
   openclaw status --deep
   ```

   Executa uma sondagem de integridade ao vivo do Gateway, incluindo sondagens de canal quando compatíveis
   (requer um Gateway acessível). Consulte [Integridade](/pt-BR/gateway/health).

5. **Acompanhe o log mais recente**

   ```bash
   openclaw logs --follow
   ```

   Se o RPC estiver fora do ar, use como fallback:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   Logs de arquivo são separados dos logs de serviço; consulte [Logs](/pt-BR/logging) e [Solução de problemas](/pt-BR/gateway/troubleshooting).

6. **Execute o doctor (reparos)**

   ```bash
   openclaw doctor
   ```

   Repara/migra configuração/estado + executa verificações de integridade. Consulte [Doctor](/pt-BR/gateway/doctor).

7. **Snapshot do Gateway**

   ```bash
   openclaw health --json
   openclaw health --verbose   # mostra a URL de destino + caminho da configuração em erros
   ```

   Solicita ao Gateway em execução um snapshot completo (somente WS). Consulte [Integridade](/pt-BR/gateway/health).

## Início rápido e configuração da primeira execução

Perguntas e respostas da primeira execução — instalação, integração inicial, rotas de autenticação, assinaturas, falhas iniciais —
ficam no [FAQ de primeira execução](/pt-BR/help/faq-first-run).

## O que é OpenClaw?

<AccordionGroup>
  <Accordion title="O que é OpenClaw, em um parágrafo?">
    OpenClaw é um assistente pessoal de IA que você executa nos seus próprios dispositivos. Ele responde nas superfícies de mensagens que você já usa (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat e Plugins de canal incluídos, como QQ Bot) e também pode oferecer voz + um Canvas ao vivo em plataformas compatíveis. O **Gateway** é o plano de controle sempre ativo; o assistente é o produto.
  </Accordion>

  <Accordion title="Proposta de valor">
    OpenClaw não é "apenas um wrapper do Claude". É um **plano de controle com prioridade local** que permite executar um
    assistente capaz no **seu próprio hardware**, acessível pelos apps de chat que você já usa, com
    sessões com estado, memória e ferramentas — sem entregar o controle dos seus fluxos de trabalho a um
    SaaS hospedado.

    Destaques:

    - **Seus dispositivos, seus dados:** execute o Gateway onde quiser (Mac, Linux, VPS) e mantenha o
      workspace + histórico de sessões local.
    - **Canais reais, não um sandbox web:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/etc,
      além de voz móvel e Canvas em plataformas compatíveis.
    - **Agnóstico a modelos:** use Anthropic, OpenAI, MiniMax, OpenRouter etc., com roteamento
      por agente e failover.
    - **Opção somente local:** execute modelos locais para que **todos os dados possam ficar no seu dispositivo**, se você quiser.
    - **Roteamento multiagente:** agentes separados por canal, conta ou tarefa, cada um com seu próprio
      workspace e padrões.
    - **Código aberto e hackable:** inspecione, estenda e hospede você mesmo sem aprisionamento a fornecedor.

    Docs: [Gateway](/pt-BR/gateway), [Canais](/pt-BR/channels), [Multiagente](/pt-BR/concepts/multi-agent),
    [Memória](/pt-BR/concepts/memory).

  </Accordion>

  <Accordion title="Acabei de configurar - o que devo fazer primeiro?">
    Bons primeiros projetos:

    - Criar um site (WordPress, Shopify ou um site estático simples).
    - Prototipar um app móvel (estrutura, telas, plano de API).
    - Organizar arquivos e pastas (limpeza, nomenclatura, marcação).
    - Conectar o Gmail e automatizar resumos ou acompanhamentos.

    Ele consegue lidar com tarefas grandes, mas funciona melhor quando você as divide em fases e
    usa subagentes para trabalho paralelo.

  </Accordion>

  <Accordion title="Quais são os cinco principais casos de uso cotidianos para OpenClaw?">
    Ganhos cotidianos geralmente se parecem com:

    - **Briefings pessoais:** resumos de caixa de entrada, calendário e notícias que importam para você.
    - **Pesquisa e redação:** pesquisa rápida, resumos e primeiros rascunhos para emails ou documentos.
    - **Lembretes e acompanhamentos:** lembretes e checklists guiados por Cron ou Heartbeat.
    - **Automação de navegador:** preencher formulários, coletar dados e repetir tarefas web.
    - **Coordenação entre dispositivos:** envie uma tarefa do telefone, deixe o Gateway executá-la em um servidor e receba o resultado de volta no chat.

  </Accordion>

  <Accordion title="OpenClaw pode ajudar com geração de leads, outreach, anúncios e blogs para um SaaS?">
    Sim para **pesquisa, qualificação e redação**. Ele pode analisar sites, criar listas curtas,
    resumir prospects e escrever rascunhos de outreach ou textos de anúncios.

    Para **outreach ou execução de anúncios**, mantenha uma pessoa no fluxo. Evite spam, siga leis locais e
    políticas das plataformas, e revise tudo antes do envio. O padrão mais seguro é deixar
    OpenClaw redigir e você aprovar.

    Docs: [Segurança](/pt-BR/gateway/security).

  </Accordion>

  <Accordion title="Quais são as vantagens vs Claude Code para desenvolvimento web?">
    OpenClaw é um **assistente pessoal** e camada de coordenação, não um substituto de IDE. Use
    Claude Code ou Codex para o loop de codificação direta mais rápido dentro de um repositório. Use OpenClaw quando você
    quiser memória durável, acesso entre dispositivos e orquestração de ferramentas.

    Vantagens:

    - **Memória persistente + workspace** entre sessões
    - **Acesso multiplataforma** (WhatsApp, Telegram, TUI, WebChat)
    - **Orquestração de ferramentas** (navegador, arquivos, agendamento, hooks)
    - **Gateway sempre ativo** (execute em um VPS, interaja de qualquer lugar)
    - **Nodes** para navegador/tela/câmera/exec locais

    Showcase: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills e automação

<AccordionGroup>
  <Accordion title="Como personalizo Skills sem manter o repositório sujo?">
    Use substituições gerenciadas em vez de editar a cópia do repositório. Coloque suas alterações em `~/.openclaw/skills/<name>/SKILL.md` (ou adicione uma pasta via `skills.load.extraDirs` em `~/.openclaw/openclaw.json`). A precedência é `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → incluídas → `skills.load.extraDirs`, então substituições gerenciadas ainda vencem Skills incluídas sem tocar no git. Se você precisar que a Skill seja instalada globalmente, mas visível apenas para alguns agentes, mantenha a cópia compartilhada em `~/.openclaw/skills` e controle a visibilidade com `agents.defaults.skills` e `agents.list[].skills`. Somente edições adequadas para upstream devem ficar no repositório e sair como PRs.
  </Accordion>

  <Accordion title="Posso carregar Skills de uma pasta personalizada?">
    Sim. Adicione diretórios extras via `skills.load.extraDirs` em `~/.openclaw/openclaw.json` (menor precedência). A precedência padrão é `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → incluídas → `skills.load.extraDirs`. `clawhub` instala em `./skills` por padrão, que OpenClaw trata como `<workspace>/skills` na próxima sessão. Se a Skill deve ficar visível apenas para certos agentes, combine isso com `agents.defaults.skills` ou `agents.list[].skills`.
  </Accordion>

  <Accordion title="Como posso usar modelos ou configurações diferentes para tarefas diferentes?">
    Hoje, os padrões compatíveis são:

    - **Jobs Cron**: jobs isolados podem definir uma substituição de `model` por job.
    - **Agentes**: roteie tarefas para agentes separados com diferentes modelos padrão, níveis de raciocínio e parâmetros de stream.
    - **Troca sob demanda**: use `/model` para trocar o modelo da sessão atual a qualquer momento.

    Por exemplo, use o mesmo modelo com configurações diferentes por agente:

    ```json5
    {
      agents: {
        list: [
          {
            id: "coder",
            model: "xiaomi/mimo-v2.5-pro",
            thinkingDefault: "high",
            params: { temperature: 0.1 },
          },
          {
            id: "chat",
            model: "xiaomi/mimo-v2.5-pro",
            thinkingDefault: "off",
            params: { temperature: 0.8 },
          },
        ],
      },
    }
    ```

    Coloque padrões compartilhados por modelo em `agents.defaults.models["provider/model"].params`, depois coloque substituições específicas do agente em `agents.list[].params` planos. Não defina entradas aninhadas separadas em `agents.list[].models["provider/model"].params` para o mesmo modelo; `agents.list[].models` é para catálogo de modelos por agente e substituições de runtime.

    Consulte [Jobs Cron](/pt-BR/automation/cron-jobs), [Roteamento multiagente](/pt-BR/concepts/multi-agent), [Configuração](/pt-BR/gateway/config-agents) e [Comandos slash](/pt-BR/tools/slash-commands).

  </Accordion>

  <Accordion title="O bot congela ao fazer trabalho pesado. Como descarrego isso?">
    Use **subagentes** para tarefas longas ou paralelas. Subagentes executam em sua própria sessão,
    retornam um resumo e mantêm seu chat principal responsivo.

    Peça ao bot para "spawn a sub-agent for this task" ou use `/subagents`.
    Use `/status` no chat para ver o que o Gateway está fazendo agora (e se ele está ocupado).

    Dica de token: tarefas longas e subagentes consomem tokens. Se custo for uma preocupação, defina um
    modelo mais barato para subagentes via `agents.defaults.subagents.model`.

    Docs: [Subagentes](/pt-BR/tools/subagents), [Tarefas em segundo plano](/pt-BR/automation/tasks).

  </Accordion>

  <Accordion title="Como funcionam sessões de subagente vinculadas a thread no Discord?">
    Use vínculos de thread. Você pode vincular uma thread do Discord a um subagente ou destino de sessão para que mensagens de acompanhamento nessa thread permaneçam naquela sessão vinculada.

    Fluxo básico:

    - Gere com `sessions_spawn` usando `thread: true` (e opcionalmente `mode: "session"` para acompanhamento persistente).
    - Ou vincule manualmente com `/focus <target>`.
    - Use `/agents` para inspecionar o estado do vínculo.
    - Use `/session idle <duration|off>` e `/session max-age <duration|off>` para controlar o auto-unfocus.
    - Use `/unfocus` para desvincular a thread.

    Configuração necessária:

    - Padrões globais: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Substituições do Discord: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - Auto-bind no spawn: `channels.discord.threadBindings.spawnSessions` tem padrão `true`; defina como `false` para desativar spawns de sessão vinculados a thread.

    Docs: [Subagentes](/pt-BR/tools/subagents), [Discord](/pt-BR/channels/discord), [Referência de configuração](/pt-BR/gateway/configuration-reference), [Comandos slash](/pt-BR/tools/slash-commands).

  </Accordion>

  <Accordion title="Um subagente terminou, mas a atualização de conclusão foi para o lugar errado ou nunca foi publicada. O que devo verificar?">
    Verifique primeiro a rota resolvida do solicitante:

    - A entrega de subagente em modo de conclusão prefere qualquer thread vinculada ou rota de conversa quando existe uma.
    - Se a origem da conclusão carrega apenas um canal, OpenClaw recorre à rota armazenada da sessão do solicitante (`lastChannel` / `lastTo` / `lastAccountId`) para que a entrega direta ainda possa ter sucesso.
    - Se não existir uma rota vinculada nem uma rota armazenada utilizável, a entrega direta pode falhar e o resultado cai para entrega de sessão em fila em vez de ser publicado imediatamente no chat.
    - Destinos inválidos ou obsoletos ainda podem forçar fallback para fila ou falha final de entrega.
    - Se a última resposta visível do assistente filho for o token silencioso exato `NO_REPLY` / `no_reply`, ou exatamente `ANNOUNCE_SKIP`, OpenClaw suprime intencionalmente o anúncio em vez de publicar progresso anterior obsoleto.
    - A saída de ferramenta/toolResult não é promovida ao texto de resultado do filho; o resultado é a resposta visível mais recente do assistente filho.

    Depuração:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    Docs: [Subagentes](/pt-BR/tools/subagents), [Tarefas em segundo plano](/pt-BR/automation/tasks), [Ferramentas de sessão](/pt-BR/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron ou lembretes não disparam. O que devo verificar?">
    Cron é executado dentro do processo do Gateway. Se o Gateway não estiver em execução continuamente,
    os trabalhos agendados não serão executados.

    Checklist:

    - Confirme que cron está habilitado (`cron.enabled`) e que `OPENCLAW_SKIP_CRON` não está definido.
    - Verifique se o Gateway está em execução 24/7 (sem suspensão/reinicializações).
    - Verifique as configurações de fuso horário do trabalho (`--tz` vs fuso horário do host).

    Depuração:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    Docs: [Trabalhos Cron](/pt-BR/automation/cron-jobs), [Automação](/pt-BR/automation).

  </Accordion>

  <Accordion title="Cron disparou, mas nada foi enviado ao canal. Por quê?">
    Verifique primeiro o modo de entrega:

    - `--no-deliver` / `delivery.mode: "none"` significa que nenhum envio de fallback do executor é esperado.
    - Alvo de anúncio ausente ou inválido (`channel` / `to`) significa que o executor pulou a entrega de saída.
    - Falhas de autenticação do canal (`unauthorized`, `Forbidden`) significam que o executor tentou entregar, mas as credenciais bloquearam.
    - Um resultado isolado silencioso (apenas `NO_REPLY` / `no_reply`) é tratado como intencionalmente não entregável, então o executor também suprime a entrega de fallback enfileirada.

    Para trabalhos cron isolados, o agente ainda pode enviar diretamente com a ferramenta `message`
    quando uma rota de chat estiver disponível. `--announce` controla apenas o caminho de
    fallback do executor para o texto final que o agente ainda não enviou.

    Depuração:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Docs: [Trabalhos Cron](/pt-BR/automation/cron-jobs), [Tarefas em segundo plano](/pt-BR/automation/tasks).

  </Accordion>

  <Accordion title="Por que uma execução cron isolada trocou de modelo ou tentou novamente uma vez?">
    Isso geralmente é o caminho de troca de modelo ao vivo, não agendamento duplicado.

    Cron isolado pode persistir uma transferência de modelo em tempo de execução e tentar novamente quando a
    execução ativa lança `LiveSessionModelSwitchError`. A nova tentativa mantém o
    provedor/modelo trocado e, se a troca carregou uma nova substituição de perfil de autenticação, o cron
    também persiste isso antes de tentar novamente.

    Regras de seleção relacionadas:

    - A substituição de modelo do hook do Gmail vence primeiro quando aplicável.
    - Depois, `model` por trabalho.
    - Depois, qualquer substituição de modelo de sessão cron armazenada.
    - Depois, a seleção normal de modelo do agente/padrão.

    O loop de nova tentativa é limitado. Após a tentativa inicial mais 2 novas tentativas de troca,
    cron aborta em vez de continuar em loop para sempre.

    Depuração:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Docs: [Trabalhos Cron](/pt-BR/automation/cron-jobs), [CLI de cron](/pt-BR/cli/cron).

  </Accordion>

  <Accordion title="Como instalo Skills no Linux?">
    Use comandos nativos `openclaw skills` ou coloque Skills no seu workspace. A interface de Skills do macOS não está disponível no Linux.
    Navegue por Skills em [https://clawhub.ai](https://clawhub.ai).

    ```bash
    openclaw skills search "calendar"
    openclaw skills search --limit 20
    openclaw skills install @owner/<skill-slug>
    openclaw skills install @owner/<skill-slug> --version <version>
    openclaw skills install @owner/<skill-slug> --force
    openclaw skills install @owner/<skill-slug> --global
    openclaw skills update --all
    openclaw skills update --all --global
    openclaw skills list --eligible
    openclaw skills check
    ```

    O `openclaw skills install` nativo grava no diretório `skills/` do workspace
    ativo por padrão. Adicione `--global` para instalar no diretório de Skills
    gerenciado compartilhado para todos os agentes locais. Instale a CLI `clawhub`
    separada somente se quiser publicar ou sincronizar suas próprias Skills. Use
    `agents.defaults.skills` ou `agents.list[].skills` se quiser restringir
    quais agentes podem ver Skills compartilhadas.

  </Accordion>

  <Accordion title="O OpenClaw pode executar tarefas em uma agenda ou continuamente em segundo plano?">
    Sim. Use o agendador do Gateway:

    - **Trabalhos Cron** para tarefas agendadas ou recorrentes (persistem entre reinicializações).
    - **Heartbeat** para verificações periódicas da "sessão principal".
    - **Trabalhos isolados** para agentes autônomos que publicam resumos ou entregam em chats.

    Docs: [Trabalhos Cron](/pt-BR/automation/cron-jobs), [Automação](/pt-BR/automation),
    [Heartbeat](/pt-BR/gateway/heartbeat).

  </Accordion>

  <Accordion title="Posso executar Skills exclusivas do Apple macOS a partir do Linux?">
    Não diretamente. Skills do macOS são controladas por `metadata.openclaw.os` mais os binários necessários, e Skills só aparecem no prompt do sistema quando são elegíveis no **host do Gateway**. No Linux, Skills exclusivas de `darwin` (como `apple-notes`, `apple-reminders`, `things-mac`) não serão carregadas a menos que você substitua esse controle.

    Você tem três padrões compatíveis:

    **Opção A - execute o Gateway em um Mac (mais simples).**
    Execute o Gateway onde os binários do macOS existem e então conecte a partir do Linux em [modo remoto](#gateway-ports-already-running-and-remote-mode) ou via Tailscale. As Skills carregam normalmente porque o host do Gateway é macOS.

    **Opção B - use um Node macOS (sem SSH).**
    Execute o Gateway no Linux, pareie um Node macOS (app da barra de menus) e defina **Comandos de execução do Node** como "Sempre perguntar" ou "Sempre permitir" no Mac. O OpenClaw pode tratar Skills exclusivas do macOS como elegíveis quando os binários necessários existem no Node. O agente executa essas Skills por meio da ferramenta `nodes`. Se você escolher "Sempre perguntar", aprovar "Sempre permitir" no prompt adiciona esse comando à lista de permissões.

    **Opção C - faça proxy de binários do macOS via SSH (avançado).**
    Mantenha o Gateway no Linux, mas faça os binários de CLI necessários resolverem para wrappers SSH que executam em um Mac. Depois substitua a Skill para permitir Linux, de modo que ela permaneça elegível.

    1. Crie um wrapper SSH para o binário (exemplo: `memo` para Apple Notes):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. Coloque o wrapper no `PATH` no host Linux (por exemplo, `~/bin/memo`).
    3. Substitua os metadados da Skill (workspace ou `~/.openclaw/skills`) para permitir Linux:

       ```markdown
       ---
       name: apple-notes
       description: Manage Apple Notes via the memo CLI on macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. Inicie uma nova sessão para que o snapshot de Skills seja atualizado.

  </Accordion>

  <Accordion title="Vocês têm uma integração com Notion ou HeyGen?">
    Não integrada hoje.

    Opções:

    - **Skill / Plugin personalizado:** melhor para acesso confiável à API (Notion/HeyGen ambos têm APIs).
    - **Automação de navegador:** funciona sem código, mas é mais lenta e mais frágil.

    Se quiser manter contexto por cliente (workflows de agência), um padrão simples é:

    - Uma página do Notion por cliente (contexto + preferências + trabalho ativo).
    - Peça ao agente para buscar essa página no início de uma sessão.

    Se quiser uma integração nativa, abra uma solicitação de recurso ou crie uma Skill
    voltada para essas APIs.

    Instalar Skills:

    ```bash
    openclaw skills install @owner/<skill-slug>
    openclaw skills update --all
    ```

    Instalações nativas vão para o diretório `skills/` do workspace ativo. Para Skills compartilhadas entre todos os agentes locais, use `openclaw skills install @owner/<skill-slug> --global` (ou coloque-as manualmente em `~/.openclaw/skills/<name>/SKILL.md`). Se apenas alguns agentes devem ver uma instalação compartilhada, configure `agents.defaults.skills` ou `agents.list[].skills`. Algumas Skills esperam binários instalados via Homebrew; no Linux, isso significa Linuxbrew (veja a entrada do FAQ do Homebrew para Linux acima). Veja [Skills](/pt-BR/tools/skills), [Configuração de Skills](/pt-BR/tools/skills-config) e [ClawHub](/pt-BR/clawhub).

  </Accordion>

  <Accordion title="Como uso meu Chrome existente já conectado com o OpenClaw?">
    Use o perfil de navegador `user` integrado, que se anexa por meio do Chrome DevTools MCP:

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    Se quiser um nome personalizado, crie um perfil MCP explícito:

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    Esse caminho pode usar o navegador do host local ou um Node de navegador conectado. Se o Gateway executar em outro lugar, execute um host de Node na máquina do navegador ou use CDP remoto.

    Limites atuais em `existing-session` / `user`:

    - ações são orientadas por ref, não por seletor CSS
    - uploads exigem `ref` / `inputRef` e atualmente oferecem suporte a um arquivo por vez
    - `responsebody`, exportação de PDF, interceptação de downloads e ações em lote ainda precisam de um navegador gerenciado ou perfil CDP bruto

  </Accordion>
</AccordionGroup>

## Sandboxing e memória

<AccordionGroup>
  <Accordion title="Existe uma documentação dedicada sobre sandboxing?">
    Sim. Veja [Sandboxing](/pt-BR/gateway/sandboxing). Para configuração específica de Docker (Gateway completo no Docker ou imagens de sandbox), veja [Docker](/pt-BR/install/docker).
  </Accordion>

  <Accordion title="Docker parece limitado - como habilito recursos completos?">
    A imagem padrão prioriza segurança e executa como o usuário `node`, portanto não
    inclui pacotes de sistema, Homebrew nem navegadores incluídos. Para uma configuração mais completa:

    - Persista `/home/node` com `OPENCLAW_HOME_VOLUME` para que caches sobrevivam.
    - Inclua dependências do sistema na imagem com `OPENCLAW_IMAGE_APT_PACKAGES`.
    - Instale navegadores Playwright via CLI incluída:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - Defina `PLAYWRIGHT_BROWSERS_PATH` e garanta que o caminho seja persistido.

    Docs: [Docker](/pt-BR/install/docker), [Navegador](/pt-BR/tools/browser).

  </Accordion>

  <Accordion title="Posso manter DMs pessoais, mas tornar grupos públicos/sandboxed com um agente?">
    Sim - se o seu tráfego privado for **DMs** e o seu tráfego público for **grupos**.

    Use `agents.defaults.sandbox.mode: "non-main"` para que sessões de grupo/canal (chaves não principais) executem no backend de sandbox configurado, enquanto a sessão principal de DM permanece no host. Docker é o backend padrão se você não escolher um. Depois, restrinja quais ferramentas ficam disponíveis em sessões sandboxed via `tools.sandbox.tools`.

    Passo a passo de configuração + exemplo de configuração: [Grupos: DMs pessoais + grupos públicos](/pt-BR/channels/groups#pattern-personal-dms-public-groups-single-agent)

    Referência de configuração principal: [Configuração do Gateway](/pt-BR/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="Como vinculo uma pasta do host ao sandbox?">
    Defina `agents.defaults.sandbox.docker.binds` como `["host:path:mode"]` (por exemplo, `"/home/user/src:/src:ro"`). Vínculos globais + por agente são mesclados; vínculos por agente são ignorados quando `scope: "shared"`. Use `:ro` para qualquer coisa sensível e lembre-se de que vínculos contornam as paredes do sistema de arquivos do sandbox.

    O OpenClaw valida fontes de vínculo tanto em relação ao caminho normalizado quanto ao caminho canônico resolvido por meio do ancestral existente mais profundo. Isso significa que escapes por pais symlink ainda falham fechados mesmo quando o último segmento do caminho ainda não existe, e verificações de raiz permitida ainda se aplicam após a resolução de symlink.

    Veja [Sandboxing](/pt-BR/gateway/sandboxing#custom-bind-mounts) e [Sandbox vs Política de ferramentas vs Elevado](/pt-BR/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) para exemplos e notas de segurança.

  </Accordion>

  <Accordion title="Como a memória funciona?">
    A memória do OpenClaw é apenas arquivos Markdown no workspace do agente:

    - Notas diárias em `memory/YYYY-MM-DD.md`
    - Notas de longo prazo curadas em `MEMORY.md` (somente sessões principais/privadas)

    O OpenClaw também executa uma **descarga de memória silenciosa pré-Compaction** para lembrar o modelo
    de gravar notas duráveis antes da compactação automática. Isso só é executado quando o workspace
    é gravável (sandboxes somente leitura pulam essa etapa). Veja [Memória](/pt-BR/concepts/memory).

  </Accordion>

  <Accordion title="A memória continua esquecendo coisas. Como faço para ela guardar?">
    Peça ao bot para **escrever o fato na memória**. Notas de longo prazo pertencem ao `MEMORY.md`,
    contexto de curto prazo vai em `memory/YYYY-MM-DD.md`.

    Esta ainda é uma área que estamos melhorando. Ajuda lembrar o modelo de armazenar memórias;
    ele saberá o que fazer. Se ele continuar esquecendo, verifique se o Gateway está usando o mesmo
    workspace em todas as execuções.

    Docs: [Memória](/pt-BR/concepts/memory), [Workspace do agente](/pt-BR/concepts/agent-workspace).

  </Accordion>

  <Accordion title="A memória persiste para sempre? Quais são os limites?">
    Arquivos de memória ficam no disco e persistem até você excluí-los. O limite é o seu
    armazenamento, não o modelo. O **contexto da sessão** ainda é limitado pela janela de
    contexto do modelo, portanto conversas longas podem sofrer compactação ou truncamento. É por isso que
    a busca na memória existe: ela traz de volta para o contexto apenas as partes relevantes.

    Docs: [Memória](/pt-BR/concepts/memory), [Contexto](/pt-BR/concepts/context).

  </Accordion>

  <Accordion title="A busca semântica na memória exige uma chave de API da OpenAI?">
    Apenas se você usar **embeddings da OpenAI**. O OAuth do Codex cobre chat/completions e
    **não** concede acesso a embeddings, portanto **entrar com o Codex (OAuth ou o
    login da CLI do Codex)** não ajuda na busca semântica na memória. Embeddings da OpenAI
    ainda precisam de uma chave de API real (`OPENAI_API_KEY` ou `models.providers.openai.apiKey`).

    Se você não definir explicitamente um provedor, o OpenClaw usa embeddings da OpenAI. Configurações
    legadas que ainda dizem `memorySearch.provider = "auto"` também resolvem para OpenAI.
    Se nenhuma chave de API da OpenAI estiver disponível, a busca semântica na memória permanece indisponível
    até você configurar uma chave ou escolher explicitamente outro provedor.

    Se você preferir manter tudo local, defina `memorySearch.provider = "local"` (e, opcionalmente,
    `memorySearch.fallback = "none"`). Se quiser embeddings do Gemini, defina
    `memorySearch.provider = "gemini"` e forneça `GEMINI_API_KEY` (ou
    `memorySearch.remote.apiKey`). Temos suporte a modelos de embedding **OpenAI, compatíveis com OpenAI, Gemini,
    Voyage, Mistral, Bedrock, Ollama, LM Studio, GitHub Copilot, DeepInfra ou locais**:
    consulte [Memória](/pt-BR/concepts/memory) para os detalhes de configuração.

  </Accordion>
</AccordionGroup>

## Onde as coisas ficam no disco

<AccordionGroup>
  <Accordion title="Todos os dados usados com o OpenClaw são salvos localmente?">
    Não: **o estado do OpenClaw é local**, mas **serviços externos ainda veem o que você envia a eles**.

    - **Local por padrão:** sessões, arquivos de memória, configuração e workspace ficam no host do Gateway
      (`~/.openclaw` + seu diretório de workspace).
    - **Remoto por necessidade:** mensagens que você envia para provedores de modelo (Anthropic/OpenAI/etc.) vão para
      as APIs deles, e plataformas de chat (WhatsApp/Telegram/Slack/etc.) armazenam dados de mensagens em seus
      servidores.
    - **Você controla a pegada:** usar modelos locais mantém prompts na sua máquina, mas o tráfego dos canais
      ainda passa pelos servidores do canal.

    Relacionado: [Workspace do agente](/pt-BR/concepts/agent-workspace), [Memória](/pt-BR/concepts/memory).

  </Accordion>

  <Accordion title="Onde o OpenClaw armazena seus dados?">
    Tudo fica em `$OPENCLAW_STATE_DIR` (padrão: `~/.openclaw`):

    | Caminho                                                         | Finalidade                                                         |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | Configuração principal (JSON5)                                     |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | Importação OAuth legada (copiada para perfis de autenticação no primeiro uso) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Perfis de autenticação (OAuth, chaves de API e `keyRef`/`tokenRef` opcionais) |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | Payload secreto opcional baseado em arquivo para provedores SecretRef `file` |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | Arquivo de compatibilidade legado (entradas estáticas de `api_key` removidas) |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | Estado do provedor (por exemplo, `whatsapp/<accountId>/creds.json`) |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | Estado por agente (agentDir + sessões)                             |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | Histórico e estado da conversa (por agente)                        |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | Metadados da sessão (por agente)                                   |

    Caminho legado de agente único: `~/.openclaw/agent/*` (migrado pelo `openclaw doctor`).

    Seu **workspace** (AGENTS.md, arquivos de memória, Skills etc.) é separado e configurado via `agents.defaults.workspace` (padrão: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="Onde AGENTS.md / SOUL.md / USER.md / MEMORY.md devem ficar?">
    Esses arquivos ficam no **workspace do agente**, não em `~/.openclaw`.

    - **Workspace (por agente)**: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md`, `memory/YYYY-MM-DD.md`, `HEARTBEAT.md` opcional.
      O `memory.md` minúsculo na raiz é apenas entrada de reparo legada; `openclaw doctor --fix`
      pode mesclá-lo em `MEMORY.md` quando ambos os arquivos existem.
    - **Diretório de estado (`~/.openclaw`)**: configuração, estado de canal/provedor, perfis de autenticação, sessões, logs
      e Skills compartilhadas (`~/.openclaw/skills`).

    O workspace padrão é `~/.openclaw/workspace`, configurável via:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    Se o bot "esquecer" após uma reinicialização, confirme que o Gateway está usando o mesmo
    workspace em todas as inicializações (e lembre-se: o modo remoto usa o workspace **do host do gateway**,
    não o do seu laptop local).

    Dica: se você quiser um comportamento ou preferência durável, peça ao bot para **escrevê-lo em
    AGENTS.md ou MEMORY.md** em vez de depender do histórico do chat.

    Consulte [Workspace do agente](/pt-BR/concepts/agent-workspace) e [Memória](/pt-BR/concepts/memory).

  </Accordion>

  <Accordion title="Posso aumentar o SOUL.md?">
    Sim. `SOUL.md` é um dos arquivos de bootstrap do workspace injetados no
    contexto do agente. O limite de injeção padrão por arquivo é de `20000` caracteres,
    e o orçamento total de bootstrap entre arquivos é de `60000` caracteres.

    Altere os padrões compartilhados na sua configuração do OpenClaw:

    ```json5
    {
      agents: {
        defaults: {
          bootstrapMaxChars: 50000,
          bootstrapTotalMaxChars: 300000,
        },
      },
    }
    ```

    Ou substitua para um agente:

    ```json5
    {
      agents: {
        list: [
          {
            id: "main",
            bootstrapMaxChars: 50000,
            bootstrapTotalMaxChars: 300000,
          },
        ],
      },
    }
    ```

    Use `/context` para verificar tamanhos brutos vs. injetados e se houve truncamento.
    Mantenha `SOUL.md` focado em voz, postura e personalidade; coloque regras operacionais
    em `AGENTS.md` e fatos duráveis na memória.

    Consulte [Contexto](/pt-BR/concepts/context) e [Configuração de agente](/pt-BR/gateway/config-agents).

  </Accordion>

  <Accordion title="Estratégia de backup recomendada">
    Coloque seu **workspace do agente** em um repositório git **privado** e faça backup em algum lugar
    privado (por exemplo, GitHub privado). Isso captura arquivos de memória + AGENTS/SOUL/USER
    e permite restaurar a "mente" do assistente mais tarde.

    **Não** faça commit de nada em `~/.openclaw` (credenciais, sessões, tokens ou payloads de segredos criptografados).
    Se você precisar de uma restauração completa, faça backup do workspace e do diretório de estado
    separadamente (consulte a pergunta sobre migração acima).

    Docs: [Workspace do agente](/pt-BR/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Como desinstalo completamente o OpenClaw?">
    Consulte o guia dedicado: [Desinstalar](/pt-BR/install/uninstall).
  </Accordion>

  <Accordion title="Agentes podem trabalhar fora do workspace?">
    Sim. O workspace é o **cwd padrão** e a âncora da memória, não um sandbox rígido.
    Caminhos relativos resolvem dentro do workspace, mas caminhos absolutos podem acessar outros
    locais do host, a menos que o sandboxing esteja habilitado. Se você precisar de isolamento, use
    [`agents.defaults.sandbox`](/pt-BR/gateway/sandboxing) ou configurações de sandbox por agente. Se você
    quiser que um repositório seja o diretório de trabalho padrão, aponte o `workspace` desse agente
    para a raiz do repositório. O repositório do OpenClaw é apenas código-fonte; mantenha o
    workspace separado, a menos que você queira intencionalmente que o agente trabalhe dentro dele.

    Exemplo (repositório como cwd padrão):

    ```json5
    {
      agents: {
        defaults: {
          workspace: "~/Projects/my-repo",
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Modo remoto: onde fica o armazenamento de sessões?">
    O estado da sessão pertence ao **host do gateway**. Se você estiver no modo remoto, o armazenamento de sessões relevante fica na máquina remota, não no seu laptop local. Consulte [Gerenciamento de sessões](/pt-BR/concepts/session).
  </Accordion>
</AccordionGroup>

## Noções básicas de configuração

<AccordionGroup>
  <Accordion title="Qual é o formato da configuração? Onde ela fica?">
    O OpenClaw lê uma configuração **JSON5** opcional de `$OPENCLAW_CONFIG_PATH` (padrão: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    Se o arquivo estiver ausente, ele usa padrões relativamente seguros (incluindo um workspace padrão de `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title='Defini gateway.bind: "lan" (ou "tailnet") e agora nada escuta / a UI diz não autorizado'>
    Associações sem loopback **exigem um caminho válido de autenticação do gateway**. Na prática, isso significa:

    - autenticação por segredo compartilhado: token ou senha
    - `gateway.auth.mode: "trusted-proxy"` atrás de um proxy reverso ciente de identidade corretamente configurado

    ```json5
    {
      gateway: {
        bind: "lan",
        auth: {
          mode: "token",
          token: "replace-me",
        },
      },
    }
    ```

    Observações:

    - `gateway.remote.token` / `.password` **não** habilitam autenticação local do gateway por si só.
    - Caminhos de chamada locais podem usar `gateway.remote.*` como fallback apenas quando `gateway.auth.*` não está definido.
    - Para autenticação por senha, defina `gateway.auth.mode: "password"` mais `gateway.auth.password` (ou `OPENCLAW_GATEWAY_PASSWORD`).
    - Se `gateway.auth.token` / `gateway.auth.password` estiver explicitamente configurado via SecretRef e não for resolvido, a resolução falha fechada (sem mascaramento por fallback remoto).
    - Configurações da Control UI com segredo compartilhado autenticam via `connect.params.auth.token` ou `connect.params.auth.password` (armazenados nas configurações do app/UI). Modos com identidade, como Tailscale Serve ou `trusted-proxy`, usam cabeçalhos de requisição. Evite colocar segredos compartilhados em URLs.
    - Com `gateway.auth.mode: "trusted-proxy"`, proxies reversos de loopback no mesmo host exigem `gateway.auth.trustedProxy.allowLoopback = true` explícito e uma entrada de loopback em `gateway.trustedProxies`.

  </Accordion>

  <Accordion title="Por que preciso de um token no localhost agora?">
    O OpenClaw impõe autenticação do gateway por padrão, incluindo loopback. No caminho padrão normal, isso significa autenticação por token: se nenhum caminho de autenticação explícito estiver configurado, a inicialização do gateway resolve para o modo de token e gera um token apenas de runtime para essa inicialização, portanto **clientes WS locais devem autenticar**. Configure `gateway.auth.token`, `gateway.auth.password`, `OPENCLAW_GATEWAY_TOKEN` ou `OPENCLAW_GATEWAY_PASSWORD` explicitamente quando os clientes precisarem de um segredo estável entre reinicializações. Isso impede que outros processos locais chamem o Gateway.

    Se você preferir um caminho de autenticação diferente, pode escolher explicitamente o modo de senha (ou, para proxies reversos com reconhecimento de identidade, `trusted-proxy`). Se você **realmente** quiser loopback aberto, defina `gateway.auth.mode: "none"` explicitamente na sua configuração. O Doctor pode gerar um token para você a qualquer momento: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="Preciso reiniciar depois de alterar a configuração?">
    O Gateway observa a configuração e oferece suporte a hot-reload:

    - `gateway.reload.mode: "hybrid"` (padrão): aplica alterações seguras a quente, reinicia para alterações críticas
    - `hot`, `restart`, `off` também são compatíveis

  </Accordion>

  <Accordion title="Como desativo frases engraçadas da CLI?">
    Defina `cli.banner.taglineMode` na configuração:

    ```json5
    {
      cli: {
        banner: {
          taglineMode: "off", // random | default | off
        },
      },
    }
    ```

    - `off`: oculta o texto da frase, mas mantém a linha de título/versão do banner.
    - `default`: usa `All your chats, one OpenClaw.` sempre.
    - `random`: frases engraçadas/sazonais rotativas (comportamento padrão).
    - Se você não quiser nenhum banner, defina a env `OPENCLAW_HIDE_BANNER=1`.

  </Accordion>

  <Accordion title="Como habilito busca na web (e busca de páginas)?">
    `web_fetch` funciona sem chave de API. `web_search` depende do provedor
    selecionado:

    - Provedores com API, como Brave, Exa, Firecrawl, Gemini, Kimi, MiniMax Search, Perplexity e Tavily, exigem a configuração normal da chave de API.
    - Grok pode reutilizar o OAuth da xAI da autenticação de modelo ou recorrer a `XAI_API_KEY` / configuração de busca na web do plugin.
    - Ollama Web Search não exige chave, mas usa o host Ollama configurado e exige `ollama signin`.
    - DuckDuckGo não exige chave, mas é uma integração não oficial baseada em HTML.
    - SearXNG não exige chave/é auto-hospedado; configure `SEARXNG_BASE_URL` ou `plugins.entries.searxng.config.webSearch.baseUrl`.

    **Recomendado:** execute `openclaw configure --section web` e escolha um provedor.
    Alternativas de ambiente:

    - Brave: `BRAVE_API_KEY`
    - Exa: `EXA_API_KEY`
    - Firecrawl: `FIRECRAWL_API_KEY`
    - Gemini: `GEMINI_API_KEY`
    - Grok: OAuth da xAI, `XAI_API_KEY`
    - Kimi: `KIMI_API_KEY` ou `MOONSHOT_API_KEY`
    - MiniMax Search: `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY` ou `MINIMAX_API_KEY`
    - Perplexity: `PERPLEXITY_API_KEY` ou `OPENROUTER_API_KEY`
    - SearXNG: `SEARXNG_BASE_URL`
    - Tavily: `TAVILY_API_KEY`

    ```json5
    {
      plugins: {
        entries: {
          brave: {
            config: {
              webSearch: {
                apiKey: "BRAVE_API_KEY_HERE",
              },
            },
          },
        },
        },
        tools: {
          web: {
            search: {
              enabled: true,
              provider: "brave",
              maxResults: 5,
            },
            fetch: {
              enabled: true,
              provider: "firecrawl", // optional; omit for auto-detect
            },
          },
        },
    }
    ```

    A configuração de busca na web específica por provedor agora fica em `plugins.entries.<plugin>.config.webSearch.*`.
    Caminhos legados de provedor em `tools.web.search.*` ainda carregam temporariamente por compatibilidade, mas não devem ser usados para novas configurações.
    A configuração de fallback de busca de páginas do Firecrawl fica em `plugins.entries.firecrawl.config.webFetch.*`.

    Observações:

    - Se você usa listas de permissão, adicione `web_search`/`web_fetch`/`x_search` ou `group:web`.
    - `web_fetch` fica habilitado por padrão (a menos que seja desabilitado explicitamente).
    - Se `tools.web.fetch.provider` for omitido, o OpenClaw detecta automaticamente o primeiro provedor de fallback de busca pronto a partir das credenciais disponíveis. O plugin oficial Firecrawl fornece esse fallback.
    - Daemons leem variáveis de ambiente de `~/.openclaw/.env` (ou do ambiente do serviço).

    Docs: [Ferramentas web](/pt-BR/tools/web).

  </Accordion>

  <Accordion title="config.apply apagou minha configuração. Como recupero e evito isso?">
    `config.apply` substitui a **configuração inteira**. Se você enviar um objeto parcial, todo o
    resto será removido.

    O OpenClaw atual protege contra muitas sobrescritas acidentais:

    - Escritas de configuração pertencentes ao OpenClaw validam a configuração completa após a alteração antes de gravar.
    - Escritas inválidas ou destrutivas pertencentes ao OpenClaw são rejeitadas e salvas como `openclaw.json.rejected.*`.
    - Se uma edição direta quebrar a inicialização ou o hot reload, o Gateway falha fechado ou ignora o reload; ele não regrava `openclaw.json`.
    - `openclaw doctor --fix` é responsável pelo reparo e pode restaurar a última configuração válida conhecida, salvando o arquivo rejeitado como `openclaw.json.clobbered.*`.

    Recupere:

    - Verifique `openclaw logs --follow` para `Invalid config at`, `Config write rejected:` ou `config reload skipped (invalid config)`.
    - Inspecione o `openclaw.json.clobbered.*` ou `openclaw.json.rejected.*` mais recente ao lado da configuração ativa.
    - Execute `openclaw config validate` e `openclaw doctor --fix`.
    - Copie de volta apenas as chaves pretendidas com `openclaw config set` ou `config.patch`.
    - Se você não tiver uma última configuração válida conhecida ou payload rejeitado, restaure de um backup ou execute novamente `openclaw doctor` e reconfigure canais/modelos.
    - Se isso foi inesperado, registre um bug e inclua sua última configuração conhecida ou qualquer backup.
    - Um agente de codificação local muitas vezes consegue reconstruir uma configuração funcional a partir de logs ou histórico.

    Evite:

    - Use `openclaw config set` para pequenas alterações.
    - Use `openclaw configure` para edições interativas.
    - Use `config.schema.lookup` primeiro quando não tiver certeza sobre um caminho exato ou o formato de um campo; ele retorna um nó de esquema superficial mais resumos dos filhos imediatos para aprofundamento.
    - Use `config.patch` para edições RPC parciais; mantenha `config.apply` apenas para substituição da configuração completa.
    - Se você estiver usando a ferramenta `gateway` voltada para agente a partir de uma execução de agente, ela ainda rejeitará escritas em `tools.exec.ask` / `tools.exec.security` (incluindo aliases legados `tools.bash.*` que normalizam para os mesmos caminhos protegidos de exec).

    Docs: [Configuração](/pt-BR/cli/config), [Configurar](/pt-BR/cli/configure), [Solução de problemas do Gateway](/pt-BR/gateway/troubleshooting#gateway-rejected-invalid-config), [Doctor](/pt-BR/gateway/doctor).

  </Accordion>

  <Accordion title="Como executo um Gateway central com workers especializados entre dispositivos?">
    O padrão comum é **um Gateway** (por exemplo, Raspberry Pi) mais **nós** e **agentes**:

    - **Gateway (central):** gerencia canais (Signal/WhatsApp), roteamento e sessões.
    - **Nós (dispositivos):** Macs/iOS/Android se conectam como periféricos e expõem ferramentas locais (`system.run`, `canvas`, `camera`).
    - **Agentes (workers):** cérebros/workspaces separados para funções especiais (por exemplo, "operações Hetzner", "dados pessoais").
    - **Subagentes:** iniciam trabalho em segundo plano a partir de um agente principal quando você quer paralelismo.
    - **TUI:** conecta-se ao Gateway e alterna agentes/sessões.

    Docs: [Nós](/pt-BR/nodes), [Acesso remoto](/pt-BR/gateway/remote), [Roteamento multiagente](/pt-BR/concepts/multi-agent), [Subagentes](/pt-BR/tools/subagents), [TUI](/pt-BR/web/tui).

  </Accordion>

  <Accordion title="O navegador do OpenClaw pode rodar sem interface gráfica?">
    Sim. É uma opção de configuração:

    ```json5
    {
      browser: { headless: true },
      agents: {
        defaults: {
          sandbox: { browser: { headless: true } },
        },
      },
    }
    ```

    O padrão é `false` (com interface). O modo headless tem mais chance de acionar verificações anti-bot em alguns sites. Consulte [Navegador](/pt-BR/tools/browser).

    O modo headless usa o **mesmo mecanismo Chromium** e funciona para a maioria das automações (formulários, cliques, scraping, logins). As principais diferenças:

    - Nenhuma janela visível do navegador (use capturas de tela se precisar de elementos visuais).
    - Alguns sites são mais rigorosos com automação no modo headless (CAPTCHAs, anti-bot).
      Por exemplo, X/Twitter costuma bloquear sessões headless.

  </Accordion>

  <Accordion title="Como uso o Brave para controle do navegador?">
    Defina `browser.executablePath` para o binário do Brave (ou qualquer navegador baseado em Chromium) e reinicie o Gateway.
    Veja os exemplos completos de configuração em [Navegador](/pt-BR/tools/browser#use-brave-or-another-chromium-based-browser).
  </Accordion>
</AccordionGroup>

## Gateways e nós remotos

<AccordionGroup>
  <Accordion title="Como os comandos se propagam entre Telegram, o gateway e nós?">
    Mensagens do Telegram são tratadas pelo **gateway**. O gateway executa o agente e
    só então chama nós pelo **Gateway WebSocket** quando uma ferramenta de nó é necessária:

    Telegram → Gateway → Agente → `node.*` → Nó → Gateway → Telegram

    Nós não veem tráfego de provedor de entrada; eles recebem apenas chamadas RPC de nó.

  </Accordion>

  <Accordion title="Como meu agente pode acessar meu computador se o Gateway está hospedado remotamente?">
    Resposta curta: **emparelhe seu computador como um nó**. O Gateway roda em outro lugar, mas pode
    chamar ferramentas `node.*` (tela, câmera, sistema) na sua máquina local pelo Gateway WebSocket.

    Configuração típica:

    1. Execute o Gateway no host sempre ligado (VPS/servidor doméstico).
    2. Coloque o host do Gateway + seu computador na mesma tailnet.
    3. Garanta que o Gateway WS esteja acessível (bind na tailnet ou túnel SSH).
    4. Abra o app macOS localmente e conecte no modo **Remote over SSH** (ou tailnet direta)
       para que ele possa se registrar como nó.
    5. Aprove o nó no Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Nenhuma ponte TCP separada é necessária; nós se conectam pelo Gateway WebSocket.

    Lembrete de segurança: emparelhar um nó macOS permite `system.run` nessa máquina. Emparelhe
    apenas dispositivos em que você confia e revise [Segurança](/pt-BR/gateway/security).

    Docs: [Nós](/pt-BR/nodes), [Protocolo do Gateway](/pt-BR/gateway/protocol), [modo remoto do macOS](/pt-BR/platforms/mac/remote), [Segurança](/pt-BR/gateway/security).

  </Accordion>

  <Accordion title="Tailscale está conectado, mas não recebo respostas. E agora?">
    Verifique o básico:

    - Gateway em execução: `openclaw gateway status`
    - Saúde do Gateway: `openclaw status`
    - Saúde dos canais: `openclaw channels status`

    Depois, verifique autenticação e roteamento:

    - Se você usa Tailscale Serve, garanta que `gateway.auth.allowTailscale` esteja definido corretamente.
    - Se você se conecta via túnel SSH, confirme que o túnel local está ativo e aponta para a porta correta.
    - Confirme que suas listas de permissão (DM ou grupo) incluem sua conta.

    Docs: [Tailscale](/pt-BR/gateway/tailscale), [Acesso remoto](/pt-BR/gateway/remote), [Canais](/pt-BR/channels).

  </Accordion>

  <Accordion title="Duas instâncias do OpenClaw podem conversar entre si (local + VPS)?">
    Sim. Não há uma ponte "bot-para-bot" integrada, mas você pode conectá-las de algumas
    formas confiáveis:

    **Mais simples:** use um canal de chat normal que ambos os bots possam acessar (Telegram/Slack/WhatsApp).
    Faça o Bot A enviar uma mensagem para o Bot B e deixe o Bot B responder normalmente.

    **Ponte CLI (genérica):** execute um script que chama o outro Gateway com
    `openclaw agent --message ... --deliver`, apontando para um chat em que o outro bot
    escuta. Se um bot estiver em um VPS remoto, aponte sua CLI para esse Gateway remoto
    via SSH/Tailscale (consulte [Acesso remoto](/pt-BR/gateway/remote)).

    Padrão de exemplo (execute de uma máquina que consiga acessar o Gateway de destino):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    Dica: adicione uma proteção para que os dois bots não entrem em loop infinito (somente menções, listas
    de permissão de canal ou uma regra "não responder a mensagens de bot").

    Docs: [Acesso remoto](/pt-BR/gateway/remote), [CLI de agente](/pt-BR/cli/agent), [Envio de agente](/pt-BR/tools/agent-send).

  </Accordion>

  <Accordion title="Preciso de VPSes separados para vários agentes?">
    Não. Um Gateway pode hospedar vários agentes, cada um com seu próprio workspace, padrões de modelo
    e roteamento. Essa é a configuração normal e é muito mais barata e simples do que executar
    um VPS por agente.

    Use VPSes separados apenas quando precisar de isolamento rígido (limites de segurança) ou configurações
    muito diferentes que você não quer compartilhar. Caso contrário, mantenha um Gateway e
    use vários agentes ou subagentes.

  </Accordion>

  <Accordion title="Há algum benefício em usar um nó no meu laptop pessoal em vez de SSH a partir de um VPS?">
    Sim - nós são a forma principal de acessar seu laptop a partir de um Gateway remoto, e eles
    desbloqueiam mais do que acesso ao shell. O Gateway roda em macOS/Linux (Windows via WSL2) e é
    leve (um VPS pequeno ou uma máquina da classe Raspberry Pi serve; 4 GB de RAM é bastante), então uma configuração comum
    é um host sempre ligado mais seu laptop como um nó.

    - **Não exige SSH de entrada.** Nós se conectam ao WebSocket do Gateway e usam pareamento de dispositivo.
    - **Controles de execução mais seguros.** `system.run` é protegido por listas de permissões/aprovações de nó nesse laptop.
    - **Mais ferramentas de dispositivo.** Nós expõem `canvas`, `camera` e `screen`, além de `system.run`.
    - **Automação de navegador local.** Mantenha o Gateway em um VPS, mas execute o Chrome localmente por meio de um host de nó no laptop, ou anexe ao Chrome local no host via Chrome MCP.

    SSH é adequado para acesso ad hoc ao shell, mas nós são mais simples para fluxos contínuos de agentes e
    automação de dispositivos.

    Docs: [Nós](/pt-BR/nodes), [CLI de nós](/pt-BR/cli/nodes), [Navegador](/pt-BR/tools/browser).

  </Accordion>

  <Accordion title="Os nós executam um serviço de gateway?">
    Não. Apenas **um gateway** deve ser executado por host, a menos que você execute perfis isolados intencionalmente (veja [Vários gateways](/pt-BR/gateway/multiple-gateways)). Nós são periféricos que se conectam
    ao gateway (nós iOS/Android, ou "modo de nó" do macOS no app da barra de menus). Para hosts de nó
    sem interface e controle via CLI, veja [CLI de host de Node](/pt-BR/cli/node).

    Uma reinicialização completa é necessária para mudanças em `gateway`, `discovery` e na superfície de Plugins hospedados.

  </Accordion>

  <Accordion title="Existe uma forma de API / RPC para aplicar configuração?">
    Sim.

    - `config.schema.lookup`: inspecione uma subárvore de configuração com seu nó de esquema superficial, dica de UI correspondente e resumos dos filhos imediatos antes de escrever
    - `config.get`: busque o snapshot atual + hash
    - `config.patch`: atualização parcial segura (preferida para a maioria das edições RPC); recarrega a quente quando possível e reinicia quando necessário
    - `config.apply`: valida + substitui a configuração completa; recarrega a quente quando possível e reinicia quando necessário
    - A ferramenta de runtime `gateway` voltada ao agente ainda se recusa a reescrever `tools.exec.ask` / `tools.exec.security`; aliases legados `tools.bash.*` normalizam para os mesmos caminhos de execução protegidos

  </Accordion>

  <Accordion title="Configuração mínima sensata para uma primeira instalação">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    Isso define seu workspace e restringe quem pode acionar o bot.

  </Accordion>

  <Accordion title="Como configuro o Tailscale em um VPS e conecto a partir do meu Mac?">
    Etapas mínimas:

    1. **Instale + faça login no VPS**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **Instale + faça login no seu Mac**
       - Use o app Tailscale e entre na mesma tailnet.
    3. **Ative MagicDNS (recomendado)**
       - No console de administração do Tailscale, ative MagicDNS para que o VPS tenha um nome estável.
    4. **Use o hostname da tailnet**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    Se você quiser a UI de controle sem SSH, use Tailscale Serve no VPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Isso mantém o gateway vinculado ao loopback e expõe HTTPS via Tailscale. Veja [Tailscale](/pt-BR/gateway/tailscale).

  </Accordion>

  <Accordion title="Como conecto um nó Mac a um Gateway remoto (Tailscale Serve)?">
    Serve expõe a **UI de controle do Gateway + WS**. Nós se conectam pelo mesmo endpoint WS do Gateway.

    Configuração recomendada:

    1. **Garanta que o VPS + Mac estejam na mesma tailnet**.
    2. **Use o app macOS no modo remoto** (o destino SSH pode ser o hostname da tailnet).
       O app criará um túnel para a porta do Gateway e se conectará como um nó.
    3. **Aprove o nó** no gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Docs: [Protocolo do Gateway](/pt-BR/gateway/protocol), [Discovery](/pt-BR/gateway/discovery), [Modo remoto do macOS](/pt-BR/platforms/mac/remote).

  </Accordion>

  <Accordion title="Devo instalar em um segundo laptop ou apenas adicionar um nó?">
    Se você só precisa de **ferramentas locais** (tela/câmera/exec) no segundo laptop, adicione-o como um
    **nó**. Isso mantém um único Gateway e evita configuração duplicada. Ferramentas de nó locais são
    atualmente exclusivas do macOS, mas planejamos estendê-las a outros sistemas operacionais.

    Instale um segundo Gateway apenas quando precisar de **isolamento rígido** ou dois bots totalmente separados.

    Docs: [Nós](/pt-BR/nodes), [CLI de nós](/pt-BR/cli/nodes), [Vários gateways](/pt-BR/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Variáveis de ambiente e carregamento de .env

<AccordionGroup>
  <Accordion title="Como o OpenClaw carrega variáveis de ambiente?">
    O OpenClaw lê variáveis de ambiente do processo pai (shell, launchd/systemd, CI etc.) e também carrega:

    - `.env` do diretório de trabalho atual
    - um fallback global `.env` de `~/.openclaw/.env` (também conhecido como `$OPENCLAW_STATE_DIR/.env`)

    Nenhum arquivo `.env` substitui variáveis de ambiente existentes.
    Variáveis de credenciais de provedor são uma exceção para o `.env` do workspace: chaves como
    `GEMINI_API_KEY`, `XAI_API_KEY` ou `MISTRAL_API_KEY` são ignoradas no `.env` do workspace
    e devem ficar no ambiente do processo, em `~/.openclaw/.env` ou no `env` da configuração.

    Você também pode definir variáveis de ambiente inline na configuração (aplicadas apenas se ausentes do ambiente do processo):

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    Veja [/environment](/pt-BR/help/environment) para precedência e fontes completas.

  </Accordion>

  <Accordion title="Iniciei o Gateway via serviço e minhas variáveis de ambiente desapareceram. E agora?">
    Duas correções comuns:

    1. Coloque as chaves ausentes em `~/.openclaw/.env` para que sejam carregadas mesmo quando o serviço não herdar o ambiente do seu shell.
    2. Ative a importação do shell (conveniência opcional):

    ```json5
    {
      env: {
        shellEnv: {
          enabled: true,
          timeoutMs: 15000,
        },
      },
    }
    ```

    Isso executa seu shell de login e importa apenas chaves esperadas ausentes (nunca substitui). Equivalentes em variáveis de ambiente:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='Defini COPILOT_GITHUB_TOKEN, mas o status dos modelos mostra "Shell env: off." Por quê?'>
    `openclaw models status` informa se a **importação do ambiente do shell** está ativada. "Shell env: off"
    **não** significa que suas variáveis de ambiente estão ausentes - significa apenas que o OpenClaw não carregará
    seu shell de login automaticamente.

    Se o Gateway roda como serviço (launchd/systemd), ele não herdará o ambiente
    do seu shell. Corrija fazendo uma destas opções:

    1. Coloque o token em `~/.openclaw/.env`:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. Ou ative a importação do shell (`env.shellEnv.enabled: true`).
    3. Ou adicione-o ao bloco `env` da sua configuração (aplica apenas se estiver ausente).

    Depois reinicie o gateway e verifique novamente:

    ```bash
    openclaw models status
    ```

    Tokens do Copilot são lidos de `COPILOT_GITHUB_TOKEN` (também `GH_TOKEN` / `GITHUB_TOKEN`).
    Veja [/concepts/model-providers](/pt-BR/concepts/model-providers) e [/environment](/pt-BR/help/environment).

  </Accordion>
</AccordionGroup>

## Sessões e múltiplos chats

<AccordionGroup>
  <Accordion title="Como inicio uma conversa nova?">
    Envie `/new` ou `/reset` como mensagem independente. Veja [Gerenciamento de sessão](/pt-BR/concepts/session).
  </Accordion>

  <Accordion title="As sessões são redefinidas automaticamente se eu nunca enviar /new?">
    Sessões podem expirar após `session.idleMinutes`, mas isso é **desativado por padrão** (padrão **0**).
    Defina para um valor positivo para ativar a expiração por inatividade. Quando ativado, a **próxima**
    mensagem após o período de inatividade inicia um novo ID de sessão para aquela chave de chat.
    Isso não exclui transcrições - apenas inicia uma nova sessão.

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="Existe uma forma de criar uma equipe de instâncias do OpenClaw (um CEO e muitos agentes)?">
    Sim, via **roteamento multiagente** e **subagentes**. Você pode criar um agente coordenador
    e vários agentes de trabalho com seus próprios workspaces e modelos.

    Dito isso, isso é melhor visto como um **experimento divertido**. Consome muitos tokens e costuma ser
    menos eficiente do que usar um bot com sessões separadas. O modelo típico que
    imaginamos é um bot com o qual você conversa, com diferentes sessões para trabalhos paralelos. Esse
    bot também pode gerar subagentes quando necessário.

    Docs: [Roteamento multiagente](/pt-BR/concepts/multi-agent), [Subagentes](/pt-BR/tools/subagents), [CLI de agentes](/pt-BR/cli/agents).

  </Accordion>

  <Accordion title="Por que o contexto foi truncado no meio da tarefa? Como evito isso?">
    O contexto da sessão é limitado pela janela do modelo. Chats longos, grandes saídas de ferramentas ou muitos
    arquivos podem acionar Compaction ou truncamento.

    O que ajuda:

    - Peça ao bot para resumir o estado atual e gravá-lo em um arquivo.
    - Use `/compact` antes de tarefas longas, e `/new` ao trocar de assunto.
    - Mantenha contexto importante no workspace e peça ao bot para lê-lo de volta.
    - Use subagentes para trabalho longo ou paralelo para que o chat principal permaneça menor.
    - Escolha um modelo com janela de contexto maior se isso acontecer com frequência.

  </Accordion>

  <Accordion title="Como redefino completamente o OpenClaw, mas mantenho-o instalado?">
    Use o comando de redefinição:

    ```bash
    openclaw reset
    ```

    Redefinição completa não interativa:

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    Depois execute a configuração novamente:

    ```bash
    openclaw onboard --install-daemon
    ```

    Observações:

    - O onboarding também oferece **Redefinir** se detectar uma configuração existente. Veja [Onboarding (CLI)](/pt-BR/start/wizard).
    - Se você usou perfis (`--profile` / `OPENCLAW_PROFILE`), redefina cada diretório de estado (os padrões são `~/.openclaw-<profile>`).
    - Redefinição de desenvolvimento: `openclaw gateway --dev --reset` (apenas dev; apaga configuração dev + credenciais + sessões + workspace).

  </Accordion>

  <Accordion title='Estou recebendo erros de "context too large" - como redefino ou compacto?'>
    Use uma destas opções:

    - **Compactar** (mantém a conversa, mas resume turnos antigos):

      ```
      /compact
      ```

      ou `/compact <instructions>` para orientar o resumo.

    - **Redefinir** (ID de sessão novo para a mesma chave de chat):

      ```
      /new
      /reset
      ```

    Se continuar acontecendo:

    - Ative ou ajuste a **poda de sessão** (`agents.defaults.contextPruning`) para reduzir saídas antigas de ferramentas.
    - Use um modelo com janela de contexto maior.

    Docs: [Compaction](/pt-BR/concepts/compaction), [Poda de sessão](/pt-BR/concepts/session-pruning), [Gerenciamento de sessão](/pt-BR/concepts/session).

  </Accordion>

  <Accordion title='Por que estou vendo "LLM request rejected: messages.content.tool_use.input field required"?'>
    Este é um erro de validação do provedor: o modelo emitiu um bloco `tool_use` sem o
    `input` obrigatório. Isso geralmente significa que o histórico da sessão está obsoleto ou corrompido (muitas vezes após threads longas
    ou uma mudança de ferramenta/esquema).

    Correção: inicie uma sessão nova com `/new` (mensagem independente).

  </Accordion>

  <Accordion title="Por que estou recebendo mensagens de Heartbeat a cada 30 minutos?">
    Heartbeats rodam a cada **30m** por padrão (**1h** ao usar autenticação OAuth). Ajuste ou desative:

    ```json5
    {
      agents: {
        defaults: {
          heartbeat: {
            every: "2h", // or "0m" to disable
          },
        },
      },
    }
    ```

    If `HEARTBEAT.md` existir, mas estiver efetivamente vazio (apenas linhas em branco,
    comentários Markdown/HTML, títulos Markdown como `# Heading`, marcadores de fence,
    ou stubs de checklist vazios), o OpenClaw pula a execução do Heartbeat para economizar chamadas de API.
    Se o arquivo estiver ausente, o Heartbeat ainda é executado e o modelo decide o que fazer.

    Substituições por agente usam `agents.list[].heartbeat`. Docs: [Heartbeat](/pt-BR/gateway/heartbeat).

  </Accordion>

  <Accordion title='Preciso adicionar uma "conta de bot" a um grupo do WhatsApp?'>
    Não. O OpenClaw roda na **sua própria conta**, então, se você está no grupo, o OpenClaw consegue vê-lo.
    Por padrão, respostas em grupo são bloqueadas até você permitir remetentes (`groupPolicy: "allowlist"`).

    Se você quiser que somente **você** consiga acionar respostas em grupo:

    ```json5
    {
      channels: {
        whatsapp: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15551234567"],
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Como obtenho o JID de um grupo do WhatsApp?">
    Opção 1 (mais rápida): acompanhe os logs e envie uma mensagem de teste no grupo:

    ```bash
    openclaw logs --follow --json
    ```

    Procure por `chatId` (ou `from`) terminando em `@g.us`, como:
    `1234567890-1234567890@g.us`.

    Opção 2 (se já configurado/na allowlist): liste grupos a partir da configuração:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    Docs: [WhatsApp](/pt-BR/channels/whatsapp), [Diretório](/pt-BR/cli/directory), [Logs](/pt-BR/cli/logs).

  </Accordion>

  <Accordion title="Por que o OpenClaw não responde em um grupo?">
    Duas causas comuns:

    - A restrição por menção está ativada (padrão). Você precisa @mencionar o bot (ou corresponder a `mentionPatterns`).
    - Você configurou `channels.whatsapp.groups` sem `"*"` e o grupo não está na allowlist.

    Consulte [Grupos](/pt-BR/channels/groups) e [Mensagens de grupo](/pt-BR/channels/group-messages).

  </Accordion>

  <Accordion title="Grupos/threads compartilham contexto com DMs?">
    Conversas diretas são consolidadas na sessão principal por padrão. Grupos/canais têm suas próprias chaves de sessão, e tópicos do Telegram / threads do Discord são sessões separadas. Consulte [Grupos](/pt-BR/channels/groups) e [Mensagens de grupo](/pt-BR/channels/group-messages).
  </Accordion>

  <Accordion title="Quantos workspaces e agentes posso criar?">
    Não há limites rígidos. Dezenas (até centenas) funcionam bem, mas fique atento a:

    - **Crescimento do disco:** sessões + transcrições ficam em `~/.openclaw/agents/<agentId>/sessions/`.
    - **Custo de tokens:** mais agentes significam mais uso concorrente de modelos.
    - **Sobrecarga operacional:** perfis de autenticação, workspaces e roteamento de canais por agente.

    Dicas:

    - Mantenha um workspace **ativo** por agente (`agents.defaults.workspace`).
    - Remova sessões antigas (exclua JSONL ou entradas de armazenamento) se o disco crescer.
    - Use `openclaw doctor` para identificar workspaces soltos e incompatibilidades de perfil.

  </Accordion>

  <Accordion title="Posso executar vários bots ou conversas ao mesmo tempo (Slack), e como devo configurar isso?">
    Sim. Use **Roteamento Multiagente** para executar vários agentes isolados e rotear mensagens recebidas por
    canal/conta/par. Slack é compatível como canal e pode ser vinculado a agentes específicos.

    O acesso ao navegador é poderoso, mas não significa "fazer tudo que um humano pode fazer": antibot, CAPTCHAs e MFA
    ainda podem bloquear a automação. Para o controle de navegador mais confiável, use Chrome MCP local no host,
    ou use CDP na máquina que realmente executa o navegador.

    Configuração recomendada:

    - Host Gateway sempre ativo (VPS/Mac mini).
    - Um agente por função (vínculos).
    - Canal(is) Slack vinculados a esses agentes.
    - Navegador local via Chrome MCP ou um Node quando necessário.

    Docs: [Roteamento Multiagente](/pt-BR/concepts/multi-agent), [Slack](/pt-BR/channels/slack),
    [Navegador](/pt-BR/tools/browser), [Nodes](/pt-BR/nodes).

  </Accordion>
</AccordionGroup>

## Modelos, failover e perfis de autenticação

Perguntas e respostas sobre modelos — padrões, seleção, aliases, troca, failover, perfis de autenticação —
ficam no [FAQ de modelos](/pt-BR/help/faq-models).

## Gateway: portas, "já em execução" e modo remoto

<AccordionGroup>
  <Accordion title="Qual porta o Gateway usa?">
    `gateway.port` controla a única porta multiplexada para WebSocket + HTTP (Control UI, hooks etc.).

    Precedência:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='Por que openclaw gateway status diz "Runtime: running", mas "Connectivity probe: failed"?'>
    Porque "running" é a visão do **supervisor** (launchd/systemd/schtasks). A sondagem de conectividade é a CLI realmente se conectando ao WebSocket do Gateway.

    Use `openclaw gateway status` e confie nestas linhas:

    - `Probe target:` (a URL que a sondagem realmente usou)
    - `Listening:` (o que está realmente vinculado à porta)
    - `Last gateway error:` (causa raiz comum quando o processo está vivo, mas a porta não está escutando)

  </Accordion>

  <Accordion title='Por que openclaw gateway status mostra "Config (cli)" e "Config (service)" diferentes?'>
    Você está editando um arquivo de configuração enquanto o serviço está executando outro (frequentemente uma incompatibilidade de `--profile` / `OPENCLAW_STATE_DIR`).

    Correção:

    ```bash
    openclaw gateway install --force
    ```

    Execute isso a partir do mesmo `--profile` / ambiente que você quer que o serviço use.

  </Accordion>

  <Accordion title='O que significa "another gateway instance is already listening"?'>
    O OpenClaw impõe um bloqueio de runtime vinculando o listener WebSocket imediatamente na inicialização (padrão `ws://127.0.0.1:18789`). Se o bind falhar com `EADDRINUSE`, ele lança `GatewayLockError`, indicando que outra instância já está escutando.

    Correção: pare a outra instância, libere a porta ou execute com `openclaw gateway --port <port>`.

  </Accordion>

  <Accordion title="Como executo o OpenClaw em modo remoto (cliente se conecta a um Gateway em outro lugar)?">
    Defina `gateway.mode: "remote"` e aponte para uma URL WebSocket remota, opcionalmente com credenciais remotas de segredo compartilhado:

    ```json5
    {
      gateway: {
        mode: "remote",
        remote: {
          url: "ws://gateway.tailnet:18789",
          token: "your-token",
          password: "your-password",
        },
      },
    }
    ```

    Observações:

    - `openclaw gateway` só inicia quando `gateway.mode` é `local` (ou quando você passa a flag de substituição).
    - O app macOS observa o arquivo de configuração e troca de modo ao vivo quando esses valores mudam.
    - `gateway.remote.token` / `.password` são apenas credenciais remotas do lado do cliente; elas não habilitam autenticação do Gateway local por si só.

  </Accordion>

  <Accordion title='A Control UI diz "unauthorized" (ou continua reconectando). E agora?'>
    O caminho de autenticação do seu Gateway e o método de autenticação da UI não correspondem.

    Fatos (a partir do código):

    - A Control UI mantém o token em `sessionStorage` para a sessão atual da aba do navegador e a URL do Gateway selecionada, então atualizações na mesma aba continuam funcionando sem restaurar persistência de token de longa duração em localStorage.
    - Em `AUTH_TOKEN_MISMATCH`, clientes confiáveis podem tentar uma nova tentativa limitada com um token de dispositivo em cache quando o Gateway retorna dicas de nova tentativa (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`).
    - Essa nova tentativa com token em cache agora reutiliza os escopos aprovados em cache armazenados com o token de dispositivo. Chamadores com `deviceToken` explícito / `scopes` explícitos ainda mantêm o conjunto de escopos solicitado em vez de herdar escopos em cache.
    - Fora desse caminho de nova tentativa, a precedência da autenticação de conexão é token/senha compartilhado explícito primeiro, depois `deviceToken` explícito, depois token de dispositivo armazenado, depois token de bootstrap.
    - O bootstrap com código de configuração integrado é apenas para Node. Após a aprovação, ele retorna um token de dispositivo de Node com `scopes: []` e não retorna um token de operador transferido.

    Correção:

    - Mais rápido: `openclaw dashboard` (imprime + copia a URL do dashboard, tenta abrir; mostra dica de SSH se estiver sem interface gráfica).
    - Se você ainda não tem um token: `openclaw doctor --generate-gateway-token`.
    - Se for remoto, faça o túnel primeiro: `ssh -N -L 18789:127.0.0.1:18789 user@host` e então abra `http://127.0.0.1:18789/`.
    - Modo de segredo compartilhado: defina `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` ou `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`, depois cole o segredo correspondente nas configurações da Control UI.
    - Modo Tailscale Serve: certifique-se de que `gateway.auth.allowTailscale` está habilitado e de que você está abrindo a URL Serve, não uma URL loopback/tailnet bruta que contorna os cabeçalhos de identidade do Tailscale.
    - Modo de proxy confiável: certifique-se de que você está vindo pelo proxy configurado com reconhecimento de identidade, não por uma URL bruta do Gateway. Proxies loopback no mesmo host também precisam de `gateway.auth.trustedProxy.allowLoopback = true`.
    - Se a incompatibilidade persistir após a única nova tentativa, rotacione/aprove novamente o token de dispositivo pareado:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - Se essa chamada de rotação disser que foi negada, verifique duas coisas:
      - sessões de dispositivo pareado só podem rotacionar o **próprio** dispositivo, a menos que também tenham `operator.admin`
      - valores explícitos de `--scope` não podem exceder os escopos de operador atuais do chamador
    - Ainda travado? Execute `openclaw status --all` e siga [Solução de problemas](/pt-BR/gateway/troubleshooting). Consulte [Dashboard](/pt-BR/web/dashboard) para detalhes de autenticação.

  </Accordion>

  <Accordion title="Defini gateway.bind como tailnet, mas ele não consegue fazer bind e nada escuta">
    O bind `tailnet` escolhe um IP Tailscale das suas interfaces de rede (100.64.0.0/10). Se a máquina não está no Tailscale (ou a interface está inativa), não há nada para vincular.

    Correção:

    - Inicie o Tailscale nesse host (para que ele tenha um endereço 100.x), ou
    - Mude para `gateway.bind: "loopback"` / `"lan"`.

    Observação: `tailnet` é explícito. `auto` prefere loopback; use `gateway.bind: "tailnet"` quando quiser um bind somente de tailnet.

  </Accordion>

  <Accordion title="Posso executar vários Gateways no mesmo host?">
    Normalmente, não: um Gateway pode executar vários canais de mensagens e agentes. Use vários Gateways somente quando precisar de redundância (ex.: bot de resgate) ou isolamento rígido.

    Sim, mas você deve isolar:

    - `OPENCLAW_CONFIG_PATH` (configuração por instância)
    - `OPENCLAW_STATE_DIR` (estado por instância)
    - `agents.defaults.workspace` (isolamento de workspace)
    - `gateway.port` (portas únicas)

    Configuração rápida (recomendada):

    - Use `openclaw --profile <name> ...` por instância (cria automaticamente `~/.openclaw-<name>`).
    - Defina um `gateway.port` único na configuração de cada perfil (ou passe `--port` para execuções manuais).
    - Instale um serviço por perfil: `openclaw --profile <name> gateway install`.

    Perfis também adicionam sufixos a nomes de serviço (`ai.openclaw.<profile>`; legado `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`).
    Guia completo: [Vários Gateways](/pt-BR/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='O que significa "invalid handshake" / código 1008?'>
    O Gateway é um **servidor WebSocket**, e espera que a primeira mensagem seja
    um frame `connect`. Se receber qualquer outra coisa, ele fecha a conexão
    com **código 1008** (violação de política).

    Causas comuns:

    - Você abriu a URL **HTTP** em um navegador (`http://...`) em vez de um cliente WS.
    - Você usou a porta ou o caminho errado.
    - Um proxy ou túnel removeu cabeçalhos de autenticação ou enviou uma solicitação que não é do Gateway.

    Correções rápidas:

    1. Use a URL WS: `ws://<host>:18789` (ou `wss://...` se HTTPS).
    2. Não abra a porta WS em uma aba normal do navegador.
    3. Se a autenticação estiver ativada, inclua o token/senha no frame `connect`.

    Se você estiver usando a CLI ou TUI, a URL deve se parecer com:

    ```
    openclaw tui --url ws://<host>:18789 --token <token>
    ```

    Detalhes do protocolo: [Protocolo do Gateway](/pt-BR/gateway/protocol).

  </Accordion>
</AccordionGroup>

## Registro de logs e depuração

<AccordionGroup>
  <Accordion title="Onde ficam os logs?">
    Logs em arquivo (estruturados):

    ```
    /tmp/openclaw/openclaw-YYYY-MM-DD.log
    ```

    Você pode definir um caminho estável via `logging.file`. O nível de log em arquivo é controlado por `logging.level`. A verbosidade do console é controlada por `--verbose` e `logging.consoleLevel`.

    Tail de log mais rápido:

    ```bash
    openclaw logs --follow
    ```

    Logs de serviço/supervisor (quando o gateway é executado via launchd/systemd):

    - stdout do launchd no macOS: `~/Library/Logs/openclaw/gateway.log` (perfis usam `gateway-<profile>.log`; stderr é suprimido)
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    Consulte [Solução de problemas](/pt-BR/gateway/troubleshooting) para saber mais.

  </Accordion>

  <Accordion title="Como inicio/paralisa/reinicio o serviço do Gateway?">
    Use os auxiliares do gateway:

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    Se você executa o gateway manualmente, `openclaw gateway --force` pode recuperar a porta. Consulte [Gateway](/pt-BR/gateway).

  </Accordion>

  <Accordion title="Fechei meu terminal no Windows - como reinicio o OpenClaw?">
    Há **três modos de instalação no Windows**:

    **1) Configuração local do Windows Hub:** o app nativo gerencia um Gateway WSL local pertencente ao app.

    Abra o **OpenClaw Companion** pelo menu Iniciar ou pela bandeja, depois use
    **Configuração do Gateway** ou a aba Conexões.

    **2) Gateway WSL2 manual:** o Gateway é executado dentro do Linux.

    Abra o PowerShell, entre no WSL e reinicie:

    ```powershell
    wsl
    openclaw gateway status
    openclaw gateway restart
    ```

    Se você nunca instalou o serviço, inicie-o em primeiro plano:

    ```bash
    openclaw gateway run
    ```

    **3) CLI/Gateway nativo do Windows:** o Gateway é executado diretamente no Windows.

    Abra o PowerShell e execute:

    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```

    Se você o executa manualmente (sem serviço), use:

    ```powershell
    openclaw gateway run
    ```

    Docs: [Windows](/pt-BR/platforms/windows), [Runbook do serviço do Gateway](/pt-BR/gateway).

  </Accordion>

  <Accordion title="O Gateway está ativo, mas as respostas nunca chegam. O que devo verificar?">
    Comece com uma varredura rápida de integridade:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    Causas comuns:

    - Autenticação do modelo não carregada no **host do gateway** (verifique `models status`).
    - Pareamento/lista de permissões do canal bloqueando respostas (verifique a configuração do canal + logs).
    - WebChat/Painel aberto sem o token correto.

    Se você está remoto, confirme que a conexão do túnel/Tailscale está ativa e que o
    WebSocket do Gateway está acessível.

    Docs: [Canais](/pt-BR/channels), [Solução de problemas](/pt-BR/gateway/troubleshooting), [Acesso remoto](/pt-BR/gateway/remote).

  </Accordion>

  <Accordion title='"Desconectado do gateway: sem motivo" - e agora?'>
    Isso geralmente significa que a UI perdeu a conexão WebSocket. Verifique:

    1. O Gateway está em execução? `openclaw gateway status`
    2. O Gateway está íntegro? `openclaw status`
    3. A UI tem o token correto? `openclaw dashboard`
    4. Se remoto, o link de túnel/Tailscale está ativo?

    Em seguida, acompanhe os logs:

    ```bash
    openclaw logs --follow
    ```

    Docs: [Painel](/pt-BR/web/dashboard), [Acesso remoto](/pt-BR/gateway/remote), [Solução de problemas](/pt-BR/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Telegram setMyCommands falha. O que devo verificar?">
    Comece pelos logs e pelo status do canal:

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    Depois, corresponda o erro:

    - `BOT_COMMANDS_TOO_MUCH`: o menu do Telegram tem entradas demais. O OpenClaw já reduz para o limite do Telegram e tenta novamente com menos comandos, mas algumas entradas do menu ainda precisam ser removidas. Reduza comandos de plugins/Skills/personalizados, ou desative `channels.telegram.commands.native` se você não precisar do menu.
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!`, ou erros de rede semelhantes: se você está em uma VPS ou atrás de um proxy, confirme que HTTPS de saída é permitido e que o DNS funciona para `api.telegram.org`.

    Se o Gateway é remoto, confira se você está vendo os logs no host do Gateway.

    Docs: [Telegram](/pt-BR/channels/telegram), [Solução de problemas de canais](/pt-BR/channels/troubleshooting).

  </Accordion>

  <Accordion title="A TUI não mostra saída. O que devo verificar?">
    Primeiro confirme que o Gateway está acessível e que o agente consegue executar:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    Na TUI, use `/status` para ver o estado atual. Se você espera respostas em um canal
    de chat, confira se a entrega está ativada (`/deliver on`).

    Docs: [TUI](/pt-BR/web/tui), [Comandos slash](/pt-BR/tools/slash-commands).

  </Accordion>

  <Accordion title="Como paro completamente e depois inicio o Gateway?">
    Se você instalou o serviço:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    Isso para/inicia o **serviço supervisionado** (launchd no macOS, systemd no Linux).
    Use isto quando o Gateway é executado em segundo plano como um daemon.

    Se você está executando em primeiro plano, pare com Ctrl-C e depois:

    ```bash
    openclaw gateway run
    ```

    Docs: [Runbook do serviço do Gateway](/pt-BR/gateway).

  </Accordion>

  <Accordion title="Explique como se eu tivesse 5 anos: openclaw gateway restart vs openclaw gateway">
    - `openclaw gateway restart`: reinicia o **serviço em segundo plano** (launchd/systemd).
    - `openclaw gateway`: executa o gateway **em primeiro plano** para esta sessão de terminal.

    Se você instalou o serviço, use os comandos do gateway. Use `openclaw gateway` quando
    quiser uma execução única em primeiro plano.

  </Accordion>

  <Accordion title="Maneira mais rápida de obter mais detalhes quando algo falha">
    Inicie o Gateway com `--verbose` para obter mais detalhes no console. Depois inspecione o arquivo de log em busca de erros de autenticação de canal, roteamento de modelo e RPC.
  </Accordion>
</AccordionGroup>

## Mídia e anexos

<AccordionGroup>
  <Accordion title="Minha Skill gerou uma imagem/PDF, mas nada foi enviado">
    Anexos de saída do agente devem usar campos de mídia estruturados, como `media`, `mediaUrl`, `path` ou `filePath`. Consulte [Configuração do assistente OpenClaw](/pt-BR/start/openclaw) e [Envio do agente](/pt-BR/tools/agent-send).

    Envio pela CLI:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    Verifique também:

    - O canal de destino aceita mídia de saída e não está bloqueado por listas de permissões.
    - O arquivo está dentro dos limites de tamanho do provedor (imagens são redimensionadas para no máximo 2048px).
    - `tools.fs.workspaceOnly=true` mantém envios por caminhos locais limitados ao workspace, diretório temporário/media-store e arquivos validados pelo sandbox.
    - `tools.fs.workspaceOnly=false` permite que envios de mídia local estruturada usem arquivos locais do host que o agente já consegue ler, mas apenas para mídia e tipos de documento seguros (imagens, áudio, vídeo, PDF, documentos Office e documentos de texto validados, como Markdown/MD, TXT, JSON, YAML e YML). Isto não é um scanner de segredos: um `secret.txt` ou `config.json` legível pelo agente pode ser anexado quando a extensão e a validação de conteúdo corresponderem. Mantenha arquivos sensíveis fora de caminhos legíveis pelo agente, ou mantenha `tools.fs.workspaceOnly=true` para envios por caminhos locais mais restritos.

    Consulte [Imagens](/pt-BR/nodes/images).

  </Accordion>
</AccordionGroup>

## Segurança e controle de acesso

<AccordionGroup>
  <Accordion title="É seguro expor o OpenClaw a DMs de entrada?">
    Trate DMs de entrada como entrada não confiável. Os padrões são projetados para reduzir o risco:

    - O comportamento padrão em canais com suporte a DM é **pareamento**:
      - Remetentes desconhecidos recebem um código de pareamento; o bot não processa a mensagem deles.
      - Aprove com: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - Solicitações pendentes são limitadas a **3 por canal**; verifique `openclaw pairing list --channel <channel> [--account <id>]` se um código não chegou.
    - Abrir DMs publicamente exige adesão explícita (`dmPolicy: "open"` e lista de permissões `"*"`).

    Execute `openclaw doctor` para revelar políticas de DM arriscadas.

  </Accordion>

  <Accordion title="Injeção de prompt é uma preocupação apenas para bots públicos?">
    Não. Injeção de prompt tem a ver com **conteúdo não confiável**, não apenas com quem pode mandar DM para o bot.
    Se seu assistente lê conteúdo externo (pesquisa/busca na web, páginas de navegador, emails,
    docs, anexos, logs colados), esse conteúdo pode incluir instruções que tentam
    sequestrar o modelo. Isso pode acontecer mesmo que **você seja o único remetente**.

    O maior risco ocorre quando ferramentas estão ativadas: o modelo pode ser enganado para
    exfiltrar contexto ou chamar ferramentas em seu nome. Reduza o raio de impacto:

    - usando um agente "leitor" somente leitura ou com ferramentas desativadas para resumir conteúdo não confiável
    - mantendo `web_search` / `web_fetch` / `browser` desativados para agentes com ferramentas ativadas
    - tratando texto decodificado de arquivos/documentos como não confiável também: OpenResponses
      `input_file` e a extração de anexos de mídia envolvem o texto extraído em
      marcadores explícitos de limite de conteúdo externo, em vez de passar texto bruto de arquivo
    - usando sandbox e listas de permissões estritas para ferramentas

    Detalhes: [Segurança](/pt-BR/gateway/security).

  </Accordion>

  <Accordion title="O OpenClaw é menos seguro porque usa TypeScript/Node em vez de Rust/WASM?">
    Linguagem e runtime importam, mas não são o principal risco para um agente
    pessoal. Os riscos práticos do OpenClaw são exposição do gateway, quem pode enviar mensagens ao
    bot, injeção de prompt, escopo de ferramentas, manuseio de credenciais, acesso ao navegador, acesso de exec
    e confiança em Skills ou plugins de terceiros.

    Rust e WASM podem oferecer isolamento mais forte para algumas classes de código, mas
    não resolvem injeção de prompt, listas de permissões ruins, exposição pública do gateway,
    ferramentas amplas demais ou um perfil de navegador que já está conectado a contas
    sensíveis. Trate estes como os controles primários:

    - mantenha o Gateway privado ou autenticado
    - use pareamento e listas de permissões para DMs e grupos
    - negue ou isole em sandbox ferramentas arriscadas para entradas não confiáveis
    - instale apenas plugins e Skills confiáveis
    - execute `openclaw security audit --deep` após alterações de configuração

    Detalhes: [Segurança](/pt-BR/gateway/security), [Sandboxing](/pt-BR/gateway/sandboxing).

  </Accordion>

  <Accordion title="Vi relatos sobre instâncias expostas do OpenClaw. O que devo verificar?">
    Primeiro verifique sua implantação real:

    ```bash
    openclaw security audit --deep
    openclaw gateway status
    ```

    Uma linha de base mais segura é:

    - Gateway vinculado a `loopback`, ou exposto apenas por meio de acesso privado
      autenticado, como uma tailnet, túnel SSH, autenticação por token/senha ou um proxy confiável
      configurado corretamente
    - DMs em modo `pairing` ou `allowlist`
    - grupos em lista de permissões e com exigência de menção, a menos que todos os membros sejam confiáveis
    - ferramentas de alto risco (`exec`, `browser`, `gateway`, `cron`) negadas ou com escopo
      estrito para agentes que leem conteúdo não confiável
    - sandboxing ativado onde a execução de ferramentas precisa de um raio de impacto menor

    Vínculos públicos sem autenticação, DMs/grupos abertos com ferramentas e controle exposto do navegador
    são os achados a corrigir primeiro. Detalhes:
    [Checklist de auditoria de segurança](/pt-BR/gateway/security#security-audit-checklist).

  </Accordion>

  <Accordion title="As Skills do ClawHub e plugins de terceiros são seguros para instalar?">
    Trate Skills e plugins de terceiros como código no qual você está escolhendo confiar.
    As páginas de Skills do ClawHub expõem o estado de varredura antes da instalação, mas varreduras não são um
    limite de segurança completo. O OpenClaw não executa bloqueio local integrado de
    código perigoso durante fluxos de instalação/atualização de plugins ou Skills; use
    `security.installPolicy` de propriedade do operador para decisões locais de permissão/bloqueio.

    Padrão mais seguro:

    - prefira autores confiáveis e versões fixadas
    - leia a Skill ou o plugin antes de habilitá-lo
    - mantenha listas de permissões de plugins e Skills restritas
    - execute fluxos de trabalho com entrada não confiável em um sandbox com ferramentas mínimas
    - evite conceder a código de terceiros acesso amplo ao sistema de arquivos, exec, navegador ou segredos

    Details: [Skills](/pt-BR/tools/skills), [Plugins](/pt-BR/tools/plugin),
    [Segurança](/pt-BR/gateway/security).

  </Accordion>

  <Accordion title="Meu bot deve ter seu próprio e-mail, conta do GitHub ou número de telefone?">
    Sim, para a maioria das configurações. Isolar o bot com contas e números de telefone separados
    reduz o raio de impacto se algo der errado. Isso também facilita alternar
    credenciais ou revogar acesso sem afetar suas contas pessoais.

    Comece pequeno. Dê acesso apenas às ferramentas e contas de que você realmente precisa e expanda
    depois, se necessário.

    Docs: [Segurança](/pt-BR/gateway/security), [Emparelhamento](/pt-BR/channels/pairing).

  </Accordion>

  <Accordion title="Posso dar autonomia sobre minhas mensagens de texto e isso é seguro?">
    **Não** recomendamos autonomia total sobre suas mensagens pessoais. O padrão mais seguro é:

    - Manter DMs em **modo de emparelhamento** ou em uma allowlist restrita.
    - Usar um **número ou conta separada** se você quiser que ele envie mensagens em seu nome.
    - Deixar que ele faça o rascunho e, então, **aprovar antes de enviar**.

    Se quiser experimentar, faça isso em uma conta dedicada e mantenha-a isolada. Veja
    [Segurança](/pt-BR/gateway/security).

  </Accordion>

  <Accordion title="Posso usar modelos mais baratos para tarefas de assistente pessoal?">
    Sim, **se** o agente for somente de chat e a entrada for confiável. Camadas menores são
    mais suscetíveis a sequestro de instruções, então evite-as para agentes com ferramentas habilitadas
    ou ao ler conteúdo não confiável. Se você precisar usar um modelo menor, restrinja
    as ferramentas e execute dentro de uma sandbox. Veja [Segurança](/pt-BR/gateway/security).
  </Accordion>

  <Accordion title="Executei /start no Telegram, mas não recebi um código de emparelhamento">
    Códigos de emparelhamento são enviados **somente** quando um remetente desconhecido envia uma mensagem ao bot e
    `dmPolicy: "pairing"` está habilitado. `/start` por si só não gera um código.

    Verifique solicitações pendentes:

    ```bash
    openclaw pairing list telegram
    ```

    Se quiser acesso imediato, adicione seu id de remetente à allowlist ou defina `dmPolicy: "open"`
    para essa conta.

  </Accordion>

  <Accordion title="WhatsApp: ele enviará mensagens aos meus contatos? Como funciona o emparelhamento?">
    Não. A política padrão de DMs do WhatsApp é **emparelhamento**. Remetentes desconhecidos recebem apenas um código de emparelhamento e a mensagem deles **não é processada**. O OpenClaw responde apenas a conversas que recebe ou a envios explícitos que você aciona.

    Aprove o emparelhamento com:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    Liste solicitações pendentes:

    ```bash
    openclaw pairing list whatsapp
    ```

    Prompt de número de telefone do assistente: ele é usado para definir sua **allowlist/proprietário**, para que suas próprias DMs sejam permitidas. Ele não é usado para envio automático. Se você executar no seu número pessoal do WhatsApp, use esse número e habilite `channels.whatsapp.selfChatMode`.

  </Accordion>
</AccordionGroup>

## Comandos de chat, interrupção de tarefas e "ele não para"

<AccordionGroup>
  <Accordion title="Como impeço que mensagens internas do sistema apareçam no chat?">
    A maioria das mensagens internas ou de ferramentas aparece somente quando **verbose**, **trace** ou **reasoning** está habilitado
    para essa sessão.

    Corrija no chat em que você vê isso:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    Se ainda estiver ruidoso, verifique as configurações da sessão na Control UI e defina verbose
    como **inherit**. Confirme também que você não está usando um perfil de bot com `verboseDefault` definido
    como `on` na configuração.

    Docs: [Pensamento e verbose](/pt-BR/tools/thinking), [Segurança](/pt-BR/gateway/security/index#reasoning-and-verbose-output-in-groups).

  </Accordion>

  <Accordion title="Como paro/cancelo uma tarefa em execução?">
    Envie qualquer uma destas opções **como uma mensagem independente** (sem barra):

    ```
    stop
    stop action
    stop current action
    stop run
    stop current run
    stop agent
    stop the agent
    stop openclaw
    openclaw stop
    stop don't do anything
    stop do not do anything
    stop doing anything
    please stop
    stop please
    abort
    esc
    wait
    exit
    interrupt
    ```

    Estes são gatilhos de interrupção (não comandos de barra).

    Para processos em segundo plano (da ferramenta exec), você pode pedir ao agente para executar:

    ```
    process action:kill sessionId:XXX
    ```

    Visão geral dos comandos de barra: veja [Comandos de barra](/pt-BR/tools/slash-commands).

    A maioria dos comandos deve ser enviada como uma mensagem **independente** que começa com `/`, mas alguns atalhos (como `/status`) também funcionam inline para remetentes na allowlist.

  </Accordion>

  <Accordion title='Como envio uma mensagem do Discord a partir do Telegram? ("Mensagens entre contextos negadas")'>
    O OpenClaw bloqueia mensagens **entre provedores** por padrão. Se uma chamada de ferramenta estiver vinculada
    ao Telegram, ela não enviará para o Discord a menos que você permita explicitamente.

    Habilite mensagens entre provedores para o agente:

    ```json5
    {
      tools: {
        message: {
          crossContext: {
            allowAcrossProviders: true,
            marker: { enabled: true, prefix: "[from {channel}] " },
          },
        },
      },
    }
    ```

    Reinicie o Gateway depois de editar a configuração.

  </Accordion>

  <Accordion title='Por que parece que o bot "ignora" mensagens em sequência rápida?'>
    Por padrão, prompts no meio da execução são direcionados para a execução ativa. Use `/queue` para escolher o comportamento da execução ativa:

    - `steer` - orientar a execução ativa no próximo limite do modelo
    - `followup` - enfileirar mensagens e executá-las uma por vez após o término da execução atual
    - `collect` - enfileirar mensagens compatíveis e responder uma vez após o término da execução atual
    - `interrupt` - interromper a execução atual e começar de novo

    O modo padrão é `steer`. Você pode adicionar opções como `debounce:0.5s cap:25 drop:summarize` para modos enfileirados. Veja [Fila de comandos](/pt-BR/concepts/queue) e [Fila de direcionamento](/pt-BR/concepts/queue-steering).

  </Accordion>
</AccordionGroup>

## Diversos

<AccordionGroup>
  <Accordion title='Qual é o modelo padrão para Anthropic com uma chave de API?'>
    No OpenClaw, credenciais e seleção de modelo são separadas. Definir `ANTHROPIC_API_KEY` (ou armazenar uma chave de API da Anthropic em perfis de autenticação) habilita a autenticação, mas o modelo padrão real é o que você configurar em `agents.defaults.model.primary` (por exemplo, `anthropic/claude-sonnet-4-6` ou `anthropic/claude-opus-4-6`). Se você vir `No credentials found for profile "anthropic:default"`, isso significa que o Gateway não conseguiu encontrar credenciais da Anthropic no `auth-profiles.json` esperado para o agente em execução.
  </Accordion>
</AccordionGroup>

---

Ainda travado? Pergunte no [Discord](https://discord.com/invite/clawd) ou abra uma [discussão no GitHub](https://github.com/openclaw/openclaw/discussions).

## Relacionado

- [FAQ da primeira execução](/pt-BR/help/faq-first-run) — instalação, onboarding, autenticação, assinaturas, falhas iniciais
- [FAQ de modelos](/pt-BR/help/faq-models) — seleção de modelo, failover, perfis de autenticação
- [Solução de problemas](/pt-BR/help/troubleshooting) — triagem por sintoma
