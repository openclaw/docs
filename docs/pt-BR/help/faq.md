---
read_when:
    - Respondendo a perguntas comuns de suporte sobre configuração inicial, instalação, onboarding ou runtime
    - Triando problemas relatados por usuários antes de uma depuração mais profunda
summary: Perguntas frequentes sobre configuração inicial, configuração e uso do OpenClaw
title: Perguntas frequentes
x-i18n:
    generated_at: "2026-04-24T05:55:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: dd0e951ed4accd924b94d6aa2963547e06b6961c7c3c98563397a9b6d36e4979
    source_path: help/faq.md
    workflow: 15
---

Respostas rápidas e solução de problemas mais aprofundada para configurações do mundo real (desenvolvimento local, VPS, múltiplos agentes, OAuth/chaves de API, failover de modelo). Para diagnósticos de runtime, consulte [Solução de problemas](/pt-BR/gateway/troubleshooting). Para a referência completa de configuração, consulte [Configuração](/pt-BR/gateway/configuration).

## Primeiros 60 segundos se algo estiver quebrado

1. **Status rápido (primeira verificação)**

   ```bash
   openclaw status
   ```

   Resumo local rápido: SO + atualização, alcance do gateway/serviço, agentes/sessões, configuração do provedor + problemas de runtime (quando o gateway está acessível).

2. **Relatório copiável (seguro para compartilhar)**

   ```bash
   openclaw status --all
   ```

   Diagnóstico somente leitura com tail de logs (tokens redigidos).

3. **Estado do daemon + porta**

   ```bash
   openclaw gateway status
   ```

   Mostra runtime do supervisor versus alcance via RPC, a URL de destino da sonda e qual configuração o serviço provavelmente usou.

4. **Sondas profundas**

   ```bash
   openclaw status --deep
   ```

   Executa uma sonda ativa de integridade do gateway, incluindo sondas de canal quando compatíveis
   (requer um gateway acessível). Consulte [Integridade](/pt-BR/gateway/health).

5. **Acompanhar o log mais recente**

   ```bash
   openclaw logs --follow
   ```

   Se o RPC estiver fora do ar, recorra a:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   Logs de arquivo são separados dos logs de serviço; consulte [Logging](/pt-BR/logging) e [Solução de problemas](/pt-BR/gateway/troubleshooting).

6. **Executar o doctor (reparos)**

   ```bash
   openclaw doctor
   ```

   Repara/migra configuração/estado + executa verificações de integridade. Consulte [Doctor](/pt-BR/gateway/doctor).

7. **Snapshot do Gateway**

   ```bash
   openclaw health --json
   openclaw health --verbose   # mostra a URL de destino + caminho da configuração em erros
   ```

   Solicita ao gateway em execução um snapshot completo (somente WS). Consulte [Integridade](/pt-BR/gateway/health).

## Início rápido e configuração da primeira execução

Perguntas e respostas da primeira execução — instalação, onboarding, rotas de autenticação, assinaturas, falhas iniciais — foram movidas para uma página dedicada:
[FAQ — início rápido e configuração da primeira execução](/pt-BR/help/faq-first-run).

## O que é OpenClaw?

<AccordionGroup>
  <Accordion title="O que é OpenClaw, em um parágrafo?">
    OpenClaw é um assistente pessoal de IA que você executa nos seus próprios dispositivos. Ele responde nas superfícies de mensagens que você já usa (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat e Plugins de canal incluídos, como QQ Bot) e também pode fazer voz + um Canvas ao vivo em plataformas compatíveis. O **Gateway** é o plano de controle sempre ativo; o assistente é o produto.
  </Accordion>

  <Accordion title="Proposta de valor">
    OpenClaw não é "apenas um wrapper do Claude". É um **plano de controle local-first** que permite executar um
    assistente capaz no **seu próprio hardware**, acessível pelos aplicativos de chat que você já usa, com
    sessões com estado, memória e ferramentas - sem entregar o controle dos seus fluxos de trabalho para um
    SaaS hospedado.

    Destaques:

    - **Seus dispositivos, seus dados:** execute o Gateway onde quiser (Mac, Linux, VPS) e mantenha o
      workspace + histórico de sessões localmente.
    - **Canais reais, não uma sandbox web:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/etc,
      além de voz móvel e Canvas em plataformas compatíveis.
    - **Independente de modelo:** use Anthropic, OpenAI, MiniMax, OpenRouter etc., com roteamento
      por agente e failover.
    - **Opção somente local:** execute modelos locais para que **todos os dados possam permanecer no seu dispositivo** se quiser.
    - **Roteamento de múltiplos agentes:** agentes separados por canal, conta ou tarefa, cada um com seu próprio
      workspace e padrões.
    - **Código aberto e hackeável:** inspecione, estenda e hospede você mesmo, sem dependência de fornecedor.

    Documentação: [Gateway](/pt-BR/gateway), [Canais](/pt-BR/channels), [Múltiplos agentes](/pt-BR/concepts/multi-agent),
    [Memória](/pt-BR/concepts/memory).

  </Accordion>

  <Accordion title="Acabei de configurar - o que devo fazer primeiro?">
    Bons primeiros projetos:

    - Criar um site (WordPress, Shopify ou um site estático simples).
    - Prototipar um aplicativo móvel (estrutura, telas, plano de API).
    - Organizar arquivos e pastas (limpeza, nomenclatura, marcação).
    - Conectar o Gmail e automatizar resumos ou acompanhamentos.

    Ele pode lidar com tarefas grandes, mas funciona melhor quando você as divide em fases e
    usa subagentes para trabalho em paralelo.

  </Accordion>

  <Accordion title="Quais são os cinco principais casos de uso cotidianos do OpenClaw?">
    Vitórias do dia a dia geralmente se parecem com isto:

    - **Briefings pessoais:** resumos da caixa de entrada, calendário e notícias que importam para você.
    - **Pesquisa e redação:** pesquisa rápida, resumos e primeiros rascunhos para e-mails ou documentos.
    - **Lembretes e acompanhamentos:** lembretes e checklists acionados por cron ou heartbeat.
    - **Automação de navegador:** preenchimento de formulários, coleta de dados e repetição de tarefas web.
    - **Coordenação entre dispositivos:** envie uma tarefa do seu celular, deixe o Gateway executá-la em um servidor e receba o resultado de volta no chat.

  </Accordion>

  <Accordion title="O OpenClaw pode ajudar com geração de leads, prospecção, anúncios e blogs para um SaaS?">
    Sim para **pesquisa, qualificação e redação**. Ele pode examinar sites, montar listas curtas,
    resumir prospects e escrever rascunhos de prospecção ou texto de anúncios.

    Para **prospecção ou campanhas de anúncios**, mantenha um humano no circuito. Evite spam, siga as leis locais e
    as políticas das plataformas e revise qualquer conteúdo antes de enviá-lo. O padrão mais seguro é deixar
    o OpenClaw redigir e você aprovar.

    Documentação: [Segurança](/pt-BR/gateway/security).

  </Accordion>

  <Accordion title="Quais são as vantagens em relação ao Claude Code para desenvolvimento web?">
    OpenClaw é um **assistente pessoal** e uma camada de coordenação, não um substituto de IDE. Use
    Claude Code ou Codex para o loop de codificação direta mais rápido dentro de um repositório. Use OpenClaw quando quiser
    memória durável, acesso entre dispositivos e orquestração de ferramentas.

    Vantagens:

    - **Memória persistente + workspace** entre sessões
    - **Acesso multiplataforma** (WhatsApp, Telegram, TUI, WebChat)
    - **Orquestração de ferramentas** (navegador, arquivos, agendamento, hooks)
    - **Gateway sempre ativo** (execute em uma VPS, interaja de qualquer lugar)
    - **Nodes** para navegador/tela/câmera/exec locais

    Showcase: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills e automação

<AccordionGroup>
  <Accordion title="Como personalizo Skills sem deixar o repositório sujo?">
    Use substituições gerenciadas em vez de editar a cópia do repositório. Coloque suas alterações em `~/.openclaw/skills/<name>/SKILL.md` (ou adicione uma pasta via `skills.load.extraDirs` em `~/.openclaw/openclaw.json`). A precedência é `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → incluídas → `skills.load.extraDirs`, então substituições gerenciadas ainda prevalecem sobre as Skills incluídas sem tocar no git. Se você precisar que a Skill seja instalada globalmente, mas visível apenas para alguns agentes, mantenha a cópia compartilhada em `~/.openclaw/skills` e controle a visibilidade com `agents.defaults.skills` e `agents.list[].skills`. Apenas alterações dignas de upstream devem ficar no repositório e sair como PRs.
  </Accordion>

  <Accordion title="Posso carregar Skills de uma pasta personalizada?">
    Sim. Adicione diretórios extras via `skills.load.extraDirs` em `~/.openclaw/openclaw.json` (precedência mais baixa). A precedência padrão é `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → incluídas → `skills.load.extraDirs`. `clawhub` instala em `./skills` por padrão, que o OpenClaw trata como `<workspace>/skills` na próxima sessão. Se a Skill deve ficar visível apenas para certos agentes, combine isso com `agents.defaults.skills` ou `agents.list[].skills`.
  </Accordion>

  <Accordion title="Como posso usar modelos diferentes para tarefas diferentes?">
    Hoje, os padrões compatíveis são:

    - **Tarefas Cron**: jobs isolados podem definir uma substituição `model` por job.
    - **Subagentes**: roteie tarefas para agentes separados com modelos padrão diferentes.
    - **Troca sob demanda**: use `/model` para trocar o modelo da sessão atual a qualquer momento.

    Consulte [Tarefas Cron](/pt-BR/automation/cron-jobs), [Roteamento de múltiplos agentes](/pt-BR/concepts/multi-agent) e [Comandos com barra](/pt-BR/tools/slash-commands).

  </Accordion>

  <Accordion title="O bot congela ao fazer trabalho pesado. Como descarrego isso?">
    Use **subagentes** para tarefas longas ou paralelas. Subagentes executam em sua própria sessão,
    retornam um resumo e mantêm seu chat principal responsivo.

    Peça ao seu bot para "criar um subagente para esta tarefa" ou use `/subagents`.
    Use `/status` no chat para ver o que o Gateway está fazendo agora (e se ele está ocupado).

    Dica de tokens: tarefas longas e subagentes consomem tokens. Se custo for uma preocupação, defina um
    modelo mais barato para subagentes via `agents.defaults.subagents.model`.

    Documentação: [Subagentes](/pt-BR/tools/subagents), [Tarefas em segundo plano](/pt-BR/automation/tasks).

  </Accordion>

  <Accordion title="Como funcionam sessões de subagente vinculadas a tópicos no Discord?">
    Use bindings de tópico. Você pode vincular um tópico do Discord a um subagente ou destino de sessão para que mensagens de acompanhamento nesse tópico permaneçam nessa sessão vinculada.

    Fluxo básico:

    - Crie com `sessions_spawn` usando `thread: true` (e opcionalmente `mode: "session"` para acompanhamento persistente).
    - Ou vincule manualmente com `/focus <target>`.
    - Use `/agents` para inspecionar o estado do binding.
    - Use `/session idle <duration|off>` e `/session max-age <duration|off>` para controlar o desfoco automático.
    - Use `/unfocus` para desvincular o tópico.

    Configuração necessária:

    - Padrões globais: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Substituições do Discord: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - Vinculação automática na criação: defina `channels.discord.threadBindings.spawnSubagentSessions: true`.

    Documentação: [Subagentes](/pt-BR/tools/subagents), [Discord](/pt-BR/channels/discord), [Referência de configuração](/pt-BR/gateway/configuration-reference), [Comandos com barra](/pt-BR/tools/slash-commands).

  </Accordion>

  <Accordion title="Um subagente terminou, mas a atualização de conclusão foi para o lugar errado ou nunca foi publicada. O que devo verificar?">
    Verifique primeiro a rota resolvida do solicitante:

    - A entrega de subagente no modo de conclusão prefere qualquer rota de tópico ou conversa vinculada quando uma existir.
    - Se a origem da conclusão carregar apenas um canal, o OpenClaw recorre à rota armazenada da sessão solicitante (`lastChannel` / `lastTo` / `lastAccountId`) para que a entrega direta ainda possa funcionar.
    - Se não existir nem uma rota vinculada nem uma rota armazenada utilizável, a entrega direta pode falhar e o resultado recorre à entrega em fila da sessão em vez de ser publicado imediatamente no chat.
    - Destinos inválidos ou obsoletos ainda podem forçar fallback para fila ou falha na entrega final.
    - Se a última resposta visível do assistente do filho for exatamente o token silencioso `NO_REPLY` / `no_reply`, ou exatamente `ANNOUNCE_SKIP`, o OpenClaw suprime intencionalmente o anúncio em vez de publicar progresso obsoleto anterior.
    - Se o filho expirou após apenas chamadas de ferramenta, o anúncio pode condensar isso em um breve resumo de progresso parcial em vez de reproduzir a saída bruta das ferramentas.

    Depuração:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    Documentação: [Subagentes](/pt-BR/tools/subagents), [Tarefas em segundo plano](/pt-BR/automation/tasks), [Ferramentas de sessão](/pt-BR/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron ou lembretes não disparam. O que devo verificar?">
    O Cron é executado dentro do processo do Gateway. Se o Gateway não estiver em execução contínua,
    os jobs agendados não serão executados.

    Checklist:

    - Confirme que o cron está ativado (`cron.enabled`) e que `OPENCLAW_SKIP_CRON` não está definido.
    - Verifique se o Gateway está em execução 24/7 (sem suspensão/reinicializações).
    - Verifique as configurações de fuso horário do job (`--tz` versus fuso horário do host).

    Depuração:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    Documentação: [Tarefas Cron](/pt-BR/automation/cron-jobs), [Automação e tarefas](/pt-BR/automation).

  </Accordion>

  <Accordion title="O Cron disparou, mas nada foi enviado para o canal. Por quê?">
    Verifique primeiro o modo de entrega:

    - `--no-deliver` / `delivery.mode: "none"` significa que nenhum envio de fallback do executor é esperado.
    - Alvo de anúncio ausente ou inválido (`channel` / `to`) significa que o executor pulou a entrega de saída.
    - Falhas de autenticação do canal (`unauthorized`, `Forbidden`) significam que o executor tentou entregar, mas as credenciais bloquearam.
    - Um resultado isolado silencioso (`NO_REPLY` / `no_reply` apenas) é tratado como intencionalmente não entregável, então o executor também suprime a entrega de fallback em fila.

    Para tarefas Cron isoladas, o agente ainda pode enviar diretamente com a ferramenta `message`
    quando uma rota de chat estiver disponível. `--announce` controla apenas o caminho de
    fallback do executor para o texto final que o agente ainda não enviou.

    Depuração:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Documentação: [Tarefas Cron](/pt-BR/automation/cron-jobs), [Tarefas em segundo plano](/pt-BR/automation/tasks).

  </Accordion>

  <Accordion title="Por que uma execução Cron isolada trocou de modelo ou tentou novamente uma vez?">
    Isso geralmente é o caminho de troca de modelo ao vivo, não agendamento duplicado.

    O Cron isolado pode persistir uma transferência de modelo em runtime e tentar novamente quando a execução ativa
    lança `LiveSessionModelSwitchError`. A nova tentativa mantém o provedor/modelo trocado e, se a troca trouxe uma nova substituição de perfil de autenticação, o cron
    também persiste isso antes de tentar novamente.

    Regras de seleção relacionadas:

    - A substituição de modelo do hook do Gmail prevalece primeiro quando aplicável.
    - Depois, o `model` por job.
    - Depois, qualquer substituição de modelo armazenada na sessão do cron.
    - Depois, a seleção normal do modelo padrão/do agente.

    O loop de novas tentativas é limitado. Após a tentativa inicial mais 2 novas tentativas por troca,
    o cron aborta em vez de entrar em loop infinito.

    Depuração:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Documentação: [Tarefas Cron](/pt-BR/automation/cron-jobs), [CLI cron](/pt-BR/cli/cron).

  </Accordion>

  <Accordion title="Como instalo Skills no Linux?">
    Use comandos nativos `openclaw skills` ou coloque Skills no seu workspace. A UI de Skills do macOS não está disponível no Linux.
    Navegue pelas Skills em [https://clawhub.ai](https://clawhub.ai).

    ```bash
    openclaw skills search "calendar"
    openclaw skills search --limit 20
    openclaw skills install <skill-slug>
    openclaw skills install <skill-slug> --version <version>
    openclaw skills install <skill-slug> --force
    openclaw skills update --all
    openclaw skills list --eligible
    openclaw skills check
    ```

    A instalação nativa com `openclaw skills install` grava no diretório `skills/`
    do workspace ativo. Instale a CLI separada `clawhub` apenas se quiser publicar ou
    sincronizar suas próprias Skills. Para instalações compartilhadas entre agentes, coloque a Skill em
    `~/.openclaw/skills` e use `agents.defaults.skills` ou
    `agents.list[].skills` se quiser restringir quais agentes podem vê-la.

  </Accordion>

  <Accordion title="O OpenClaw pode executar tarefas em um cronograma ou continuamente em segundo plano?">
    Sim. Use o agendador do Gateway:

    - **Tarefas Cron** para tarefas agendadas ou recorrentes (persistem após reinicializações).
    - **Heartbeat** para verificações periódicas da "sessão principal".
    - **Tarefas isoladas** para agentes autônomos que publicam resumos ou entregam em chats.

    Documentação: [Tarefas Cron](/pt-BR/automation/cron-jobs), [Automação e tarefas](/pt-BR/automation),
    [Heartbeat](/pt-BR/gateway/heartbeat).

  </Accordion>

  <Accordion title="Posso executar Skills exclusivas do macOS Apple a partir do Linux?">
    Não diretamente. Skills do macOS são controladas por `metadata.openclaw.os` mais binários exigidos, e as Skills só aparecem no prompt de sistema quando são elegíveis no **host do Gateway**. No Linux, Skills exclusivas de `darwin` (como `apple-notes`, `apple-reminders`, `things-mac`) não serão carregadas, a menos que você substitua esse controle.

    Você tem três padrões compatíveis:

    **Opção A - executar o Gateway em um Mac (mais simples).**
    Execute o Gateway onde existirem os binários do macOS e depois conecte-se do Linux em [modo remoto](#gateway-ports-already-running-and-remote-mode) ou por Tailscale. As Skills carregam normalmente porque o host do Gateway é macOS.

    **Opção B - usar um node macOS (sem SSH).**
    Execute o Gateway no Linux, pareie um node macOS (aplicativo de barra de menu) e defina **Node Run Commands** como "Always Ask" ou "Always Allow" no Mac. O OpenClaw pode tratar Skills exclusivas do macOS como elegíveis quando os binários exigidos existirem no node. O agente executa essas Skills pela ferramenta `nodes`. Se você escolher "Always Ask", aprovar "Always Allow" no prompt adiciona esse comando à allowlist.

    **Opção C - fazer proxy de binários do macOS por SSH (avançado).**
    Mantenha o Gateway no Linux, mas faça com que os binários CLI exigidos sejam resolvidos para wrappers SSH executados em um Mac. Depois substitua a Skill para permitir Linux, de modo que ela continue elegível.

    1. Crie um wrapper SSH para o binário (exemplo: `memo` para Apple Notes):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. Coloque o wrapper no `PATH` no host Linux (por exemplo `~/bin/memo`).
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

  <Accordion title="Vocês têm integração com Notion ou HeyGen?">
    Não de forma nativa hoje.

    Opções:

    - **Skill / Plugin personalizado:** melhor para acesso confiável à API (Notion/HeyGen ambos têm APIs).
    - **Automação de navegador:** funciona sem código, mas é mais lenta e mais frágil.

    Se você quiser manter contexto por cliente (fluxos de agência), um padrão simples é:

    - Uma página do Notion por cliente (contexto + preferências + trabalho ativo).
    - Pedir ao agente para buscar essa página no início de uma sessão.

    Se você quiser uma integração nativa, abra uma solicitação de recurso ou crie uma Skill
    voltada para essas APIs.

    Instalar Skills:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    Instalações nativas vão para o diretório `skills/` do workspace ativo. Para Skills compartilhadas entre agentes, coloque-as em `~/.openclaw/skills/<name>/SKILL.md`. Se apenas alguns agentes devem ver uma instalação compartilhada, configure `agents.defaults.skills` ou `agents.list[].skills`. Algumas Skills esperam binários instalados via Homebrew; no Linux isso significa Linuxbrew (veja a entrada do FAQ sobre Homebrew no Linux acima). Consulte [Skills](/pt-BR/tools/skills), [Configuração de Skills](/pt-BR/tools/skills-config) e [ClawHub](/pt-BR/tools/clawhub).

  </Accordion>

  <Accordion title="Como uso meu Chrome já autenticado com o OpenClaw?">
    Use o perfil de navegador `user` incluído, que se conecta por Chrome DevTools MCP:

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    Se quiser um nome personalizado, crie um perfil MCP explícito:

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    Esse caminho pode usar o navegador do host local ou um node de navegador conectado. Se o Gateway estiver sendo executado em outro lugar, execute um host node na máquina do navegador ou use CDP remoto.

    Limites atuais em `existing-session` / `user`:

    - ações são baseadas em ref, não em seletor CSS
    - uploads exigem `ref` / `inputRef` e atualmente oferecem suporte a um arquivo por vez
    - `responsebody`, exportação de PDF, interceptação de download e ações em lote ainda exigem um navegador gerenciado ou perfil CDP bruto

  </Accordion>
</AccordionGroup>

## Sandboxing e memória

<AccordionGroup>
  <Accordion title="Existe uma documentação dedicada para sandboxing?">
    Sim. Consulte [Sandboxing](/pt-BR/gateway/sandboxing). Para configuração específica do Docker (Gateway completo em Docker ou imagens de sandbox), consulte [Docker](/pt-BR/install/docker).
  </Accordion>

  <Accordion title="O Docker parece limitado - como ativo recursos completos?">
    A imagem padrão prioriza segurança e é executada como o usuário `node`, então não
    inclui pacotes do sistema, Homebrew nem navegadores incluídos. Para uma configuração mais completa:

    - Persista `/home/node` com `OPENCLAW_HOME_VOLUME` para que os caches sobrevivam.
    - Inclua dependências do sistema na imagem com `OPENCLAW_DOCKER_APT_PACKAGES`.
    - Instale navegadores do Playwright via a CLI incluída:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - Defina `PLAYWRIGHT_BROWSERS_PATH` e garanta que o caminho seja persistido.

    Documentação: [Docker](/pt-BR/install/docker), [Navegador](/pt-BR/tools/browser).

  </Accordion>

  <Accordion title="Posso manter DMs pessoais, mas tornar grupos públicos/em sandbox com um único agente?">
    Sim - se seu tráfego privado for em **DMs** e seu tráfego público for em **grupos**.

    Use `agents.defaults.sandbox.mode: "non-main"` para que sessões de grupo/canal (chaves não principais) sejam executadas no backend de sandbox configurado, enquanto a sessão principal de DM permanece no host. Docker é o backend padrão se você não escolher um. Depois restrinja quais ferramentas ficam disponíveis em sessões com sandbox por meio de `tools.sandbox.tools`.

    Passo a passo de configuração + exemplo: [Grupos: DMs pessoais + grupos públicos](/pt-BR/channels/groups#pattern-personal-dms-public-groups-single-agent)

    Referência das principais configurações: [Configuração do Gateway](/pt-BR/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="Como vinculo uma pasta do host ao sandbox?">
    Defina `agents.defaults.sandbox.docker.binds` como `["host:path:mode"]` (por exemplo `"/home/user/src:/src:ro"`). Bindings globais + por agente são mesclados; bindings por agente são ignorados quando `scope: "shared"`. Use `:ro` para qualquer coisa sensível e lembre-se de que binds contornam as barreiras do sistema de arquivos do sandbox.

    O OpenClaw valida fontes de bind tanto em relação ao caminho normalizado quanto ao caminho canônico resolvido pelo ancestral existente mais profundo. Isso significa que escapes por pai via symlink ainda falham de forma fechada mesmo quando o último segmento do caminho ainda não existe, e verificações de raiz permitida continuam se aplicando após a resolução de symlink.

    Consulte [Sandboxing](/pt-BR/gateway/sandboxing#custom-bind-mounts) e [Sandbox vs Tool Policy vs Elevated](/pt-BR/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) para exemplos e observações de segurança.

  </Accordion>

  <Accordion title="Como a memória funciona?">
    A memória do OpenClaw é apenas arquivos Markdown no workspace do agente:

    - Notas diárias em `memory/YYYY-MM-DD.md`
    - Notas curadas de longo prazo em `MEMORY.md` (somente sessões principais/privadas)

    O OpenClaw também executa um **flush silencioso de memória antes da Compaction** para lembrar o modelo
    de gravar notas duráveis antes da Compaction automática. Isso só é executado quando o workspace
    é gravável (sandboxes somente leitura ignoram isso). Consulte [Memória](/pt-BR/concepts/memory).

  </Accordion>

  <Accordion title="A memória continua esquecendo coisas. Como faço para fixar?">
    Peça ao bot para **gravar o fato na memória**. Notas de longo prazo pertencem a `MEMORY.md`,
    contexto de curto prazo vai para `memory/YYYY-MM-DD.md`.

    Esta ainda é uma área que estamos melhorando. Ajuda lembrar o modelo de armazenar memórias;
    ele saberá o que fazer. Se continuar esquecendo, verifique se o Gateway está usando o mesmo
    workspace em todas as execuções.

    Documentação: [Memória](/pt-BR/concepts/memory), [Workspace do agente](/pt-BR/concepts/agent-workspace).

  </Accordion>

  <Accordion title="A memória persiste para sempre? Quais são os limites?">
    Arquivos de memória vivem em disco e persistem até você excluí-los. O limite é seu
    armazenamento, não o modelo. O **contexto da sessão** ainda é limitado pela janela de contexto
    do modelo, então conversas longas podem passar por compaction ou truncamento. É por isso que
    existe a busca em memória - ela traz de volta ao contexto apenas as partes relevantes.

    Documentação: [Memória](/pt-BR/concepts/memory), [Contexto](/pt-BR/concepts/context).

  </Accordion>

  <Accordion title="A busca semântica na memória exige uma chave de API OpenAI?">
    Apenas se você usar **embeddings da OpenAI**. O OAuth do Codex cobre chat/completions e
    **não** concede acesso a embeddings, então **fazer login com Codex (OAuth ou
    login do Codex CLI)** não ajuda na busca semântica de memória. Embeddings da OpenAI
    ainda exigem uma chave de API real (`OPENAI_API_KEY` ou `models.providers.openai.apiKey`).

    Se você não definir um provedor explicitamente, o OpenClaw seleciona um provedor automaticamente quando
    consegue resolver uma chave de API (perfis de autenticação, `models.providers.*.apiKey` ou variáveis de ambiente).
    Ele prefere OpenAI se uma chave OpenAI for resolvida, caso contrário Gemini se uma chave Gemini
    for resolvida, depois Voyage e depois Mistral. Se nenhuma chave remota estiver disponível, a busca em
    memória permanece desativada até que você a configure. Se você tiver um caminho de modelo local
    configurado e presente, o OpenClaw
    prefere `local`. Ollama é compatível quando você define explicitamente
    `memorySearch.provider = "ollama"`.

    Se preferir permanecer local, defina `memorySearch.provider = "local"` (e opcionalmente
    `memorySearch.fallback = "none"`). Se quiser embeddings do Gemini, defina
    `memorySearch.provider = "gemini"` e forneça `GEMINI_API_KEY` (ou
    `memorySearch.remote.apiKey`). Oferecemos suporte a modelos de embedding de **OpenAI, Gemini, Voyage, Mistral, Ollama ou local** - consulte [Memória](/pt-BR/concepts/memory) para detalhes de configuração.

  </Accordion>
</AccordionGroup>

## Onde as coisas ficam no disco

<AccordionGroup>
  <Accordion title="Todos os dados usados com o OpenClaw são salvos localmente?">
    Não - **o estado do OpenClaw é local**, mas **serviços externos ainda veem o que você envia a eles**.

    - **Local por padrão:** sessões, arquivos de memória, configuração e workspace vivem no host do Gateway
      (`~/.openclaw` + diretório do seu workspace).
    - **Remoto por necessidade:** mensagens que você envia a provedores de modelo (Anthropic/OpenAI/etc.) vão para
      as APIs deles, e plataformas de chat (WhatsApp/Telegram/Slack/etc.) armazenam dados de mensagem nos
      servidores delas.
    - **Você controla a pegada:** usar modelos locais mantém prompts na sua máquina, mas o tráfego
      de canal ainda passa pelos servidores do canal.

    Relacionado: [Workspace do agente](/pt-BR/concepts/agent-workspace), [Memória](/pt-BR/concepts/memory).

  </Accordion>

  <Accordion title="Onde o OpenClaw armazena seus dados?">
    Tudo fica em `$OPENCLAW_STATE_DIR` (padrão: `~/.openclaw`):

    | Path                                                            | Finalidade                                                         |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | Configuração principal (JSON5)                                     |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | Importação legada de OAuth (copiada para perfis de autenticação no primeiro uso) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Perfis de autenticação (OAuth, chaves de API e `keyRef`/`tokenRef` opcionais) |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | Payload opcional de segredo baseado em arquivo para provedores `file` SecretRef |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | Arquivo legado de compatibilidade (entradas estáticas `api_key` são limpas) |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | Estado do provedor (por exemplo `whatsapp/<accountId>/creds.json`) |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | Estado por agente (agentDir + sessões)                             |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | Histórico e estado da conversa (por agente)                        |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | Metadados de sessão (por agente)                                   |

    Caminho legado de agente único: `~/.openclaw/agent/*` (migrado por `openclaw doctor`).

    Seu **workspace** (`AGENTS.md`, arquivos de memória, Skills etc.) é separado e configurado via `agents.defaults.workspace` (padrão: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="Onde AGENTS.md / SOUL.md / USER.md / MEMORY.md devem ficar?">
    Esses arquivos ficam no **workspace do agente**, não em `~/.openclaw`.

    - **Workspace (por agente)**: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md`, `memory/YYYY-MM-DD.md`, opcionalmente `HEARTBEAT.md`.
      `memory.md` em minúsculas na raiz é apenas entrada de reparo legado; `openclaw doctor --fix`
      pode mesclá-lo em `MEMORY.md` quando ambos os arquivos existirem.
    - **Diretório de estado (`~/.openclaw`)**: configuração, estado de canal/provedor, perfis de autenticação, sessões, logs
      e Skills compartilhadas (`~/.openclaw/skills`).

    O workspace padrão é `~/.openclaw/workspace`, configurável via:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    Se o bot "esquece" após um reinício, confirme se o Gateway está usando o mesmo
    workspace em toda inicialização (e lembre-se: o modo remoto usa o **workspace do host do gateway**,
    não o do seu laptop local).

    Dica: se você quiser um comportamento ou preferência durável, peça ao bot para **gravar isso em
    AGENTS.md ou MEMORY.md** em vez de depender do histórico do chat.

    Consulte [Workspace do agente](/pt-BR/concepts/agent-workspace) e [Memória](/pt-BR/concepts/memory).

  </Accordion>

  <Accordion title="Estratégia de backup recomendada">
    Coloque seu **workspace do agente** em um repositório git **privado** e faça backup dele em algum lugar
    privado (por exemplo GitHub privado). Isso captura memória + arquivos AGENTS/SOUL/USER
    e permite restaurar a "mente" do assistente depois.

    **Não** faça commit de nada em `~/.openclaw` (credenciais, sessões, tokens ou payloads de segredos criptografados).
    Se você precisar de uma restauração completa, faça backup separadamente do workspace e do diretório de estado
    (consulte a pergunta sobre migração acima).

    Documentação: [Workspace do agente](/pt-BR/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Como desinstalo completamente o OpenClaw?">
    Consulte o guia dedicado: [Desinstalar](/pt-BR/install/uninstall).
  </Accordion>

  <Accordion title="Os agentes podem trabalhar fora do workspace?">
    Sim. O workspace é o **cwd padrão** e âncora de memória, não um sandbox rígido.
    Caminhos relativos são resolvidos dentro do workspace, mas caminhos absolutos podem acessar outros
    locais do host, a menos que o sandboxing esteja ativado. Se você precisar de isolamento, use
    [`agents.defaults.sandbox`](/pt-BR/gateway/sandboxing) ou configurações de sandbox por agente. Se quiser
    que um repositório seja o diretório de trabalho padrão, aponte o `workspace`
    desse agente para a raiz do repositório. O repositório do OpenClaw é apenas código-fonte; mantenha o
    workspace separado, a menos que você intencionalmente queira que o agente trabalhe dentro dele.

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

  <Accordion title="Modo remoto: onde fica o armazenamento de sessão?">
    O estado da sessão pertence ao **host do gateway**. Se você estiver em modo remoto, o armazenamento de sessão que importa está na máquina remota, não no seu laptop local. Consulte [Gerenciamento de sessão](/pt-BR/concepts/session).
  </Accordion>
</AccordionGroup>

## Noções básicas de configuração

<AccordionGroup>
  <Accordion title="Qual é o formato da configuração? Onde ela fica?">
    O OpenClaw lê uma configuração opcional em **JSON5** de `$OPENCLAW_CONFIG_PATH` (padrão: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    Se o arquivo estiver ausente, ele usa padrões razoavelmente seguros (incluindo um workspace padrão em `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title='Defini `gateway.bind: "lan"` (ou `"tailnet"`) e agora nada escuta / a UI diz unauthorized'>
    Binds fora de loopback **exigem um caminho de autenticação do gateway válido**. Na prática isso significa:

    - autenticação por segredo compartilhado: token ou senha
    - `gateway.auth.mode: "trusted-proxy"` atrás de um proxy reverso com reconhecimento de identidade fora de loopback corretamente configurado

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

    - `gateway.remote.token` / `.password` por si só **não** ativam a autenticação do gateway local.
    - Caminhos de chamada locais podem usar `gateway.remote.*` como fallback somente quando `gateway.auth.*` não estiver definido.
    - Para autenticação por senha, defina `gateway.auth.mode: "password"` mais `gateway.auth.password` (ou `OPENCLAW_GATEWAY_PASSWORD`).
    - Se `gateway.auth.token` / `gateway.auth.password` estiver explicitamente configurado via SecretRef e não puder ser resolvido, a resolução falha de forma fechada (sem mascaramento por fallback remoto).
    - Configurações da Control UI com segredo compartilhado autenticam via `connect.params.auth.token` ou `connect.params.auth.password` (armazenados nas configurações do app/UI). Modos com identidade, como Tailscale Serve ou `trusted-proxy`, usam cabeçalhos de solicitação. Evite colocar segredos compartilhados em URLs.
    - Com `gateway.auth.mode: "trusted-proxy"`, proxies reversos em loopback no mesmo host ainda **não** satisfazem a autenticação trusted-proxy. O proxy confiável deve ser uma fonte configurada fora de loopback.

  </Accordion>

  <Accordion title="Por que agora preciso de um token no localhost?">
    O OpenClaw aplica autenticação de gateway por padrão, inclusive em loopback. No caminho padrão normal isso significa autenticação por token: se nenhum caminho explícito de autenticação estiver configurado, a inicialização do gateway resolve para o modo token e gera um automaticamente, salvando-o em `gateway.auth.token`, então **clientes WS locais precisam se autenticar**. Isso impede que outros processos locais chamem o Gateway.

    Se você preferir um caminho de autenticação diferente, pode escolher explicitamente o modo senha (ou, para proxies reversos com reconhecimento de identidade fora de loopback, `trusted-proxy`). Se você **realmente** quiser loopback aberto, defina explicitamente `gateway.auth.mode: "none"` na configuração. O doctor pode gerar um token para você a qualquer momento: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="Preciso reiniciar depois de mudar a configuração?">
    O Gateway observa a configuração e oferece suporte a hot-reload:

    - `gateway.reload.mode: "hybrid"` (padrão): hot-apply para alterações seguras, reinício para as críticas
    - `hot`, `restart`, `off` também são compatíveis

  </Accordion>

  <Accordion title="Como desativo slogans engraçados da CLI?">
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

    - `off`: oculta o texto do slogan, mas mantém a linha de título/versão do banner.
    - `default`: usa `All your chats, one OpenClaw.` sempre.
    - `random`: slogans rotativos engraçados/sazonais (comportamento padrão).
    - Se você quiser ocultar completamente o banner, defina o env `OPENCLAW_HIDE_BANNER=1`.

  </Accordion>

  <Accordion title="Como ativo pesquisa na web (e web fetch)?">
    `web_fetch` funciona sem chave de API. `web_search` depende do provedor
    selecionado:

    - Provedores baseados em API como Brave, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Perplexity e Tavily exigem a configuração normal da chave de API.
    - Ollama Web Search não exige chave, mas usa o host Ollama configurado e requer `ollama signin`.
    - DuckDuckGo não exige chave, mas é uma integração não oficial baseada em HTML.
    - SearXNG é sem chave/auto-hospedado; configure `SEARXNG_BASE_URL` ou `plugins.entries.searxng.config.webSearch.baseUrl`.

    **Recomendado:** execute `openclaw configure --section web` e escolha um provedor.
    Alternativas por ambiente:

    - Brave: `BRAVE_API_KEY`
    - Exa: `EXA_API_KEY`
    - Firecrawl: `FIRECRAWL_API_KEY`
    - Gemini: `GEMINI_API_KEY`
    - Grok: `XAI_API_KEY`
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
              provider: "firecrawl", // opcional; omita para autodetecção
            },
          },
        },
    }
    ```

    A configuração específica do provedor para pesquisa na web agora fica em `plugins.entries.<plugin>.config.webSearch.*`.
    Caminhos legados de provedor `tools.web.search.*` ainda carregam temporariamente por compatibilidade, mas não devem ser usados em novas configurações.
    A configuração de fallback de web fetch do Firecrawl fica em `plugins.entries.firecrawl.config.webFetch.*`.

    Observações:

    - Se você usar allowlists, adicione `web_search`/`web_fetch`/`x_search` ou `group:web`.
    - `web_fetch` está ativado por padrão (a menos que seja explicitamente desativado).
    - Se `tools.web.fetch.provider` for omitido, o OpenClaw detecta automaticamente o primeiro provedor de fallback de fetch pronto a partir das credenciais disponíveis. Hoje o provedor incluído é o Firecrawl.
    - Daemons leem variáveis de ambiente de `~/.openclaw/.env` (ou do ambiente do serviço).

    Documentação: [Ferramentas web](/pt-BR/tools/web).

  </Accordion>

  <Accordion title="config.apply apagou minha configuração. Como recupero e evito isso?">
    `config.apply` substitui a **configuração inteira**. Se você enviar um objeto parcial, todo o
    resto será removido.

    O OpenClaw atual protege contra muitas sobrescritas acidentais:

    - Gravações de configuração pertencentes ao OpenClaw validam a configuração completa após a alteração antes de gravar.
    - Gravações inválidas ou destrutivas pertencentes ao OpenClaw são rejeitadas e salvas como `openclaw.json.rejected.*`.
    - Se uma edição direta quebrar a inicialização ou o hot reload, o Gateway restaura a última configuração válida conhecida e salva o arquivo rejeitado como `openclaw.json.clobbered.*`.
    - O agente principal recebe um aviso de inicialização após a recuperação para que não grave cegamente a configuração ruim novamente.

    Recuperação:

    - Verifique `openclaw logs --follow` em busca de `Config auto-restored from last-known-good`, `Config write rejected:` ou `config reload restored last-known-good config`.
    - Inspecione o `openclaw.json.clobbered.*` ou `openclaw.json.rejected.*` mais recente ao lado da configuração ativa.
    - Mantenha a configuração restaurada ativa se ela funcionar, depois copie de volta apenas as chaves pretendidas com `openclaw config set` ou `config.patch`.
    - Execute `openclaw config validate` e `openclaw doctor`.
    - Se você não tiver last-known-good nem payload rejeitado, restaure de um backup ou execute novamente `openclaw doctor` e reconfigure canais/modelos.
    - Se isso foi inesperado, registre um bug e inclua sua última configuração conhecida ou qualquer backup.
    - Um agente de codificação local muitas vezes consegue reconstruir uma configuração funcional a partir de logs ou histórico.

    Evite isso:

    - Use `openclaw config set` para pequenas alterações.
    - Use `openclaw configure` para edições interativas.
    - Use `config.schema.lookup` primeiro quando não tiver certeza sobre um caminho exato ou formato de campo; ele retorna um nó de schema superficial mais resumos imediatos dos filhos para exploração progressiva.
    - Use `config.patch` para edições RPC parciais; deixe `config.apply` apenas para substituição da configuração completa.
    - Se você estiver usando a ferramenta `gateway`, exclusiva do proprietário, a partir de uma execução de agente, ela ainda rejeitará gravações em `tools.exec.ask` / `tools.exec.security` (incluindo aliases legados `tools.bash.*` que normalizam para os mesmos caminhos protegidos de exec).

    Documentação: [Config](/pt-BR/cli/config), [Configure](/pt-BR/cli/configure), [Solução de problemas do Gateway](/pt-BR/gateway/troubleshooting#gateway-restored-last-known-good-config), [Doctor](/pt-BR/gateway/doctor).

  </Accordion>

  <Accordion title="Como executo um Gateway central com workers especializados em vários dispositivos?">
    O padrão comum é **um Gateway** (por exemplo Raspberry Pi) mais **nodes** e **agentes**:

    - **Gateway (central):** controla canais (Signal/WhatsApp), roteamento e sessões.
    - **Nodes (dispositivos):** Macs/iOS/Android se conectam como periféricos e expõem ferramentas locais (`system.run`, `canvas`, `camera`).
    - **Agentes (workers):** cérebros/workspaces separados para papéis especiais (por exemplo "Hetzner ops", "Dados pessoais").
    - **Subagentes:** criam trabalho em segundo plano a partir de um agente principal quando você quer paralelismo.
    - **TUI:** conecta ao Gateway e alterna agentes/sessões.

    Documentação: [Nodes](/pt-BR/nodes), [Acesso remoto](/pt-BR/gateway/remote), [Roteamento de múltiplos agentes](/pt-BR/concepts/multi-agent), [Subagentes](/pt-BR/tools/subagents), [TUI](/pt-BR/web/tui).

  </Accordion>

  <Accordion title="O navegador do OpenClaw pode ser executado em headless?">
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

    O padrão é `false` (com interface). Headless tem maior probabilidade de acionar verificações anti-bot em alguns sites. Consulte [Navegador](/pt-BR/tools/browser).

    O modo headless usa o **mesmo mecanismo Chromium** e funciona para a maior parte da automação (formulários, cliques, raspagem, logins). As principais diferenças:

    - Não há janela de navegador visível (use screenshots se precisar de elementos visuais).
    - Alguns sites são mais rígidos com automação em modo headless (CAPTCHAs, anti-bot).
      Por exemplo, X/Twitter frequentemente bloqueia sessões headless.

  </Accordion>

  <Accordion title="Como uso o Brave para controle do navegador?">
    Defina `browser.executablePath` para o binário do Brave (ou qualquer navegador baseado em Chromium) e reinicie o Gateway.
    Consulte os exemplos completos de configuração em [Navegador](/pt-BR/tools/browser#use-brave-or-another-chromium-based-browser).
  </Accordion>
</AccordionGroup>

## Gateways remotos e nodes

<AccordionGroup>
  <Accordion title="Como os comandos se propagam entre Telegram, o gateway e nodes?">
    Mensagens do Telegram são tratadas pelo **gateway**. O gateway executa o agente e
    só então chama nodes pela **WebSocket do Gateway** quando uma ferramenta de node é necessária:

    Telegram → Gateway → Agente → `node.*` → Node → Gateway → Telegram

    Nodes não veem tráfego de provedor de entrada; eles recebem apenas chamadas RPC de node.

  </Accordion>

  <Accordion title="Como meu agente pode acessar meu computador se o Gateway estiver hospedado remotamente?">
    Resposta curta: **pareie seu computador como um node**. O Gateway é executado em outro lugar, mas pode
    chamar ferramentas `node.*` (tela, câmera, sistema) na sua máquina local pela WebSocket do Gateway.

    Configuração típica:

    1. Execute o Gateway no host sempre ativo (VPS/servidor doméstico).
    2. Coloque o host do Gateway + seu computador na mesma tailnet.
    3. Garanta que a WS do Gateway esteja acessível (bind tailnet ou túnel SSH).
    4. Abra o aplicativo macOS localmente e conecte em modo **Remote over SSH** (ou tailnet direto)
       para que ele possa se registrar como um node.
    5. Aprove o node no Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Não é necessária nenhuma bridge TCP separada; nodes se conectam pela WebSocket do Gateway.

    Lembrete de segurança: parear um node macOS permite `system.run` nessa máquina. Só
    pareie dispositivos em que você confia e revise [Segurança](/pt-BR/gateway/security).

    Documentação: [Nodes](/pt-BR/nodes), [Protocolo do Gateway](/pt-BR/gateway/protocol), [modo remoto no macOS](/pt-BR/platforms/mac/remote), [Segurança](/pt-BR/gateway/security).

  </Accordion>

  <Accordion title="O Tailscale está conectado, mas não recebo respostas. E agora?">
    Verifique o básico:

    - Gateway está em execução: `openclaw gateway status`
    - Integridade do Gateway: `openclaw status`
    - Integridade do canal: `openclaw channels status`

    Depois verifique autenticação e roteamento:

    - Se você usa Tailscale Serve, certifique-se de que `gateway.auth.allowTailscale` esteja configurado corretamente.
    - Se você se conecta via túnel SSH, confirme que o túnel local está ativo e aponta para a porta correta.
    - Confirme que suas allowlists (DM ou grupo) incluem sua conta.

    Documentação: [Tailscale](/pt-BR/gateway/tailscale), [Acesso remoto](/pt-BR/gateway/remote), [Canais](/pt-BR/channels).

  </Accordion>

  <Accordion title="Duas instâncias do OpenClaw podem conversar entre si (local + VPS)?">
    Sim. Não existe uma bridge nativa "bot para bot" embutida, mas você pode montá-la de algumas
    formas confiáveis:

    **Mais simples:** use um canal de chat normal ao qual ambos os bots tenham acesso (Telegram/Slack/WhatsApp).
    Faça o Bot A enviar uma mensagem ao Bot B e depois deixe o Bot B responder normalmente.

    **Bridge por CLI (genérica):** execute um script que chama o outro Gateway com
    `openclaw agent --message ... --deliver`, direcionando para um chat onde o outro bot
    escuta. Se um bot estiver em uma VPS remota, aponte sua CLI para esse Gateway remoto
    via SSH/Tailscale (consulte [Acesso remoto](/pt-BR/gateway/remote)).

    Padrão de exemplo (execute a partir de uma máquina que consiga alcançar o Gateway de destino):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    Dica: adicione um guardrail para que os dois bots não entrem em loop infinito (somente menção, allowlists de canal ou uma regra de "não responder a mensagens de bot").

    Documentação: [Acesso remoto](/pt-BR/gateway/remote), [CLI do agente](/pt-BR/cli/agent), [Agent send](/pt-BR/tools/agent-send).

  </Accordion>

  <Accordion title="Preciso de VPSs separadas para vários agentes?">
    Não. Um Gateway pode hospedar vários agentes, cada um com seu próprio workspace, padrões de modelo
    e roteamento. Essa é a configuração normal e é muito mais barata e simples do que executar
    uma VPS por agente.

    Use VPSs separadas apenas quando precisar de isolamento rígido (limites de segurança) ou de
    configurações muito diferentes que não queira compartilhar. Caso contrário, mantenha um Gateway e
    use vários agentes ou subagentes.

  </Accordion>

  <Accordion title="Há vantagem em usar um node no meu laptop pessoal em vez de SSH a partir de uma VPS?">
    Sim - nodes são a forma de primeira classe de alcançar seu laptop a partir de um Gateway remoto e
    desbloqueiam mais do que acesso ao shell. O Gateway é executado em macOS/Linux (Windows via WSL2) e é
    leve (uma VPS pequena ou um equipamento da classe Raspberry Pi é suficiente; 4 GB de RAM são mais que suficientes), então uma configuração comum
    é um host sempre ativo mais seu laptop como node.

    - **Sem SSH de entrada necessário.** Nodes se conectam à WebSocket do Gateway e usam pareamento de dispositivo.
    - **Controles de execução mais seguros.** `system.run` é controlado por allowlists/aprovações de node nesse laptop.
    - **Mais ferramentas de dispositivo.** Nodes expõem `canvas`, `camera` e `screen` além de `system.run`.
    - **Automação de navegador local.** Mantenha o Gateway em uma VPS, mas execute o Chrome localmente através de um host node no laptop ou conecte-se ao Chrome local no host via Chrome MCP.

    SSH é aceitável para acesso ad hoc ao shell, mas nodes são mais simples para fluxos de trabalho contínuos do agente e
    automação de dispositivos.

    Documentação: [Nodes](/pt-BR/nodes), [CLI de Nodes](/pt-BR/cli/nodes), [Navegador](/pt-BR/tools/browser).

  </Accordion>

  <Accordion title="Nodes executam um serviço de gateway?">
    Não. Apenas **um gateway** deve ser executado por host, a menos que você intencionalmente execute perfis isolados (consulte [Múltiplos gateways](/pt-BR/gateway/multiple-gateways)). Nodes são periféricos que se conectam
    ao gateway (nodes de iOS/Android ou "modo node" do macOS no aplicativo de barra de menu). Para hosts node headless
    e controle por CLI, consulte [CLI do host Node](/pt-BR/cli/node).

    Um reinício completo é necessário para alterações em `gateway`, `discovery` e `canvasHost`.

  </Accordion>

  <Accordion title="Existe uma forma de API / RPC para aplicar configuração?">
    Sim.

    - `config.schema.lookup`: inspeciona uma subárvore da configuração com seu nó de schema superficial, dica de UI correspondente e resumos imediatos dos filhos antes de gravar
    - `config.get`: busca o snapshot atual + hash
    - `config.patch`: atualização parcial segura (preferida para a maioria das edições RPC); recarrega a quente quando possível e reinicia quando necessário
    - `config.apply`: valida + substitui a configuração completa; recarrega a quente quando possível e reinicia quando necessário
    - A ferramenta de runtime `gateway`, exclusiva do proprietário, ainda se recusa a regravar `tools.exec.ask` / `tools.exec.security`; aliases legados `tools.bash.*` normalizam para os mesmos caminhos protegidos de exec

  </Accordion>

  <Accordion title="Configuração mínima razoável para uma primeira instalação">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    Isso define seu workspace e restringe quem pode acionar o bot.

  </Accordion>

  <Accordion title="Como configuro o Tailscale em uma VPS e me conecto a partir do meu Mac?">
    Etapas mínimas:

    1. **Instalar + fazer login na VPS**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **Instalar + fazer login no seu Mac**
       - Use o app Tailscale e entre na mesma tailnet.
    3. **Ativar MagicDNS (recomendado)**
       - No console de administração do Tailscale, ative o MagicDNS para que a VPS tenha um nome estável.
    4. **Usar o hostname da tailnet**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    Se você quiser a Control UI sem SSH, use Tailscale Serve na VPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Isso mantém o gateway vinculado ao loopback e expõe HTTPS via Tailscale. Consulte [Tailscale](/pt-BR/gateway/tailscale).

  </Accordion>

  <Accordion title="Como conecto um node Mac a um Gateway remoto (Tailscale Serve)?">
    O Serve expõe a **Control UI + WS do Gateway**. Nodes se conectam pelo mesmo endpoint WS do Gateway.

    Configuração recomendada:

    1. **Certifique-se de que a VPS + Mac estão na mesma tailnet**.
    2. **Use o app macOS em modo Remote** (o destino SSH pode ser o hostname da tailnet).
       O app criará um túnel para a porta do Gateway e se conectará como um node.
    3. **Aprove o node** no gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Documentação: [Protocolo do Gateway](/pt-BR/gateway/protocol), [Discovery](/pt-BR/gateway/discovery), [modo remoto no macOS](/pt-BR/platforms/mac/remote).

  </Accordion>

  <Accordion title="Devo instalar em um segundo laptop ou apenas adicionar um node?">
    Se você só precisa de **ferramentas locais** (tela/câmera/exec) no segundo laptop, adicione-o como
    **node**. Isso mantém um único Gateway e evita configuração duplicada. Ferramentas locais de node
    atualmente são exclusivas do macOS, mas planejamos estendê-las a outros sistemas.

    Instale um segundo Gateway apenas quando precisar de **isolamento rígido** ou de dois bots totalmente separados.

    Documentação: [Nodes](/pt-BR/nodes), [CLI de Nodes](/pt-BR/cli/nodes), [Múltiplos gateways](/pt-BR/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Variáveis de ambiente e carregamento de .env

<AccordionGroup>
  <Accordion title="Como o OpenClaw carrega variáveis de ambiente?">
    O OpenClaw lê variáveis de ambiente do processo pai (shell, launchd/systemd, CI etc.) e também carrega:

    - `.env` do diretório de trabalho atual
    - um `.env` global de fallback de `~/.openclaw/.env` (também conhecido como `$OPENCLAW_STATE_DIR/.env`)

    Nenhum dos arquivos `.env` substitui variáveis de ambiente já existentes.

    Você também pode definir variáveis de ambiente inline na configuração (aplicadas somente se estiverem ausentes no env do processo):

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    Consulte [/environment](/pt-BR/help/environment) para ver precedência e fontes completas.

  </Accordion>

  <Accordion title="Iniciei o Gateway via serviço e minhas variáveis de ambiente desapareceram. E agora?">
    Duas correções comuns:

    1. Coloque as chaves ausentes em `~/.openclaw/.env` para que sejam carregadas mesmo quando o serviço não herdar o env do seu shell.
    2. Ative importação de shell (conveniência opt-in):

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

    Isso executa seu shell de login e importa apenas chaves esperadas ausentes (nunca substitui). Equivalentes por variável de ambiente:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='Defini COPILOT_GITHUB_TOKEN, mas models status mostra "Shell env: off." Por quê?'>
    `openclaw models status` informa se a **importação de env do shell** está ativada. "Shell env: off"
    **não** significa que suas variáveis de ambiente estão ausentes - apenas significa que o OpenClaw não carregará
    automaticamente seu shell de login.

    Se o Gateway for executado como serviço (launchd/systemd), ele não herdará o ambiente do seu shell.
    Corrija de uma destas formas:

    1. Coloque o token em `~/.openclaw/.env`:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. Ou ative a importação de shell (`env.shellEnv.enabled: true`).
    3. Ou adicione-o ao bloco `env` da configuração (aplica-se apenas se estiver ausente).

    Depois reinicie o gateway e verifique novamente:

    ```bash
    openclaw models status
    ```

    Tokens do Copilot são lidos de `COPILOT_GITHUB_TOKEN` (também `GH_TOKEN` / `GITHUB_TOKEN`).
    Consulte [/concepts/model-providers](/pt-BR/concepts/model-providers) e [/environment](/pt-BR/help/environment).

  </Accordion>
</AccordionGroup>

## Sessões e vários chats

<AccordionGroup>
  <Accordion title="Como inicio uma conversa nova?">
    Envie `/new` ou `/reset` como mensagem independente. Consulte [Gerenciamento de sessão](/pt-BR/concepts/session).
  </Accordion>

  <Accordion title="As sessões são redefinidas automaticamente se eu nunca enviar /new?">
    As sessões podem expirar após `session.idleMinutes`, mas isso vem **desativado por padrão** (padrão **0**).
    Defina um valor positivo para ativar a expiração por inatividade. Quando ativada, a **próxima**
    mensagem após o período de inatividade inicia um novo ID de sessão para essa chave de chat.
    Isso não exclui transcrições - apenas inicia uma nova sessão.

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="Existe uma forma de criar uma equipe de instâncias OpenClaw (um CEO e muitos agentes)?">
    Sim, via **roteamento de múltiplos agentes** e **subagentes**. Você pode criar um agente
    coordenador e vários agentes workers com seus próprios workspaces e modelos.

    Dito isso, isso é melhor visto como um **experimento divertido**. Consome muitos tokens e muitas vezes
    é menos eficiente do que usar um bot com sessões separadas. O modelo típico que
    imaginamos é um bot com o qual você conversa, com sessões diferentes para trabalho paralelo. Esse
    bot também pode criar subagentes quando necessário.

    Documentação: [Roteamento de múltiplos agentes](/pt-BR/concepts/multi-agent), [Subagentes](/pt-BR/tools/subagents), [CLI de agentes](/pt-BR/cli/agents).

  </Accordion>

  <Accordion title="Por que o contexto foi truncado no meio da tarefa? Como evito isso?">
    O contexto da sessão é limitado pela janela do modelo. Chats longos, saídas grandes de ferramentas ou muitos
    arquivos podem disparar compaction ou truncamento.

    O que ajuda:

    - Peça ao bot para resumir o estado atual e gravá-lo em um arquivo.
    - Use `/compact` antes de tarefas longas e `/new` ao trocar de assunto.
    - Mantenha o contexto importante no workspace e peça ao bot para lê-lo novamente.
    - Use subagentes para trabalhos longos ou paralelos para que o chat principal permaneça menor.
    - Escolha um modelo com janela de contexto maior se isso acontecer com frequência.

  </Accordion>

  <Accordion title="Como redefino completamente o OpenClaw, mas mantenho a instalação?">
    Use o comando de reset:

    ```bash
    openclaw reset
    ```

    Reset completo não interativo:

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    Depois execute novamente a configuração:

    ```bash
    openclaw onboard --install-daemon
    ```

    Observações:

    - O onboarding também oferece **Reset** se detectar uma configuração existente. Consulte [Onboarding (CLI)](/pt-BR/start/wizard).
    - Se você usou perfis (`--profile` / `OPENCLAW_PROFILE`), redefina cada diretório de estado (os padrões são `~/.openclaw-<profile>`).
    - Reset de desenvolvimento: `openclaw gateway --dev --reset` (somente desenvolvimento; limpa configuração, credenciais, sessões e workspace de desenvolvimento).

  </Accordion>

  <Accordion title='Estou recebendo erros "context too large" - como redefino ou faço compaction?'>
    Use uma destas opções:

    - **Compact** (mantém a conversa, mas resume turnos mais antigos):

      ```
      /compact
      ```

      ou `/compact <instructions>` para orientar o resumo.

    - **Reset** (novo ID de sessão para a mesma chave de chat):

      ```
      /new
      /reset
      ```

    Se continuar acontecendo:

    - Ative ou ajuste a **poda de sessão** (`agents.defaults.contextPruning`) para aparar saídas antigas de ferramentas.
    - Use um modelo com janela de contexto maior.

    Documentação: [Compaction](/pt-BR/concepts/compaction), [Poda de sessão](/pt-BR/concepts/session-pruning), [Gerenciamento de sessão](/pt-BR/concepts/session).

  </Accordion>

  <Accordion title='Por que estou vendo "LLM request rejected: messages.content.tool_use.input field required"?'>
    Isso é um erro de validação do provedor: o modelo emitiu um bloco `tool_use` sem o `input`
    obrigatório. Geralmente significa que o histórico da sessão está desatualizado ou corrompido (muitas vezes após threads longas
    ou mudança de ferramenta/schema).

    Correção: inicie uma sessão nova com `/new` (mensagem independente).

  </Accordion>

  <Accordion title="Por que estou recebendo mensagens de heartbeat a cada 30 minutos?">
    Heartbeats são executados a cada **30m** por padrão (**1h** ao usar autenticação OAuth). Ajuste ou desative:

    ```json5
    {
      agents: {
        defaults: {
          heartbeat: {
            every: "2h", // ou "0m" para desativar
          },
        },
      },
    }
    ```

    Se `HEARTBEAT.md` existir, mas estiver efetivamente vazio (apenas linhas em branco e cabeçalhos markdown
    como `# Heading`), o OpenClaw ignora a execução do heartbeat para economizar chamadas de API.
    Se o arquivo estiver ausente, o heartbeat ainda é executado e o modelo decide o que fazer.

    Substituições por agente usam `agents.list[].heartbeat`. Documentação: [Heartbeat](/pt-BR/gateway/heartbeat).

  </Accordion>

  <Accordion title='Preciso adicionar uma "conta de bot" a um grupo do WhatsApp?'>
    Não. O OpenClaw é executado na **sua própria conta**, então, se você estiver no grupo, o OpenClaw poderá vê-lo.
    Por padrão, respostas em grupo são bloqueadas até que você permita remetentes (`groupPolicy: "allowlist"`).

    Se você quiser que apenas **você** possa acionar respostas em grupo:

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

    Opção 2 (se já estiver configurado/na allowlist): liste grupos da configuração:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    Documentação: [WhatsApp](/pt-BR/channels/whatsapp), [Directory](/pt-BR/cli/directory), [Logs](/pt-BR/cli/logs).

  </Accordion>

  <Accordion title="Por que o OpenClaw não responde em um grupo?">
    Duas causas comuns:

    - A exigência de menção está ativada (padrão). Você precisa @mencionar o bot (ou corresponder a `mentionPatterns`).
    - Você configurou `channels.whatsapp.groups` sem `"*"` e o grupo não está na allowlist.

    Consulte [Grupos](/pt-BR/channels/groups) e [Mensagens de grupo](/pt-BR/channels/group-messages).

  </Accordion>

  <Accordion title="Grupos/threads compartilham contexto com DMs?">
    Chats diretos são recolhidos para a sessão principal por padrão. Grupos/canais têm suas próprias chaves de sessão, e tópicos do Telegram / threads do Discord são sessões separadas. Consulte [Grupos](/pt-BR/channels/groups) e [Mensagens de grupo](/pt-BR/channels/group-messages).
  </Accordion>

  <Accordion title="Quantos workspaces e agentes posso criar?">
    Não há limites rígidos. Dezenas (até centenas) funcionam bem, mas observe:

    - **Crescimento em disco:** sessões + transcrições ficam em `~/.openclaw/agents/<agentId>/sessions/`.
    - **Custo de tokens:** mais agentes significam mais uso simultâneo de modelos.
    - **Sobrecarga operacional:** perfis de autenticação, workspaces e roteamento de canal por agente.

    Dicas:

    - Mantenha um workspace **ativo** por agente (`agents.defaults.workspace`).
    - Pode sessões antigas (exclua JSONL ou entradas do armazenamento) se o disco crescer.
    - Use `openclaw doctor` para detectar workspaces dispersos e incompatibilidades de perfil.

  </Accordion>

  <Accordion title="Posso executar vários bots ou chats ao mesmo tempo (Slack), e como devo configurar isso?">
    Sim. Use **Roteamento de múltiplos agentes** para executar vários agentes isolados e rotear mensagens de entrada por
    canal/conta/par. O Slack é compatível como canal e pode ser vinculado a agentes específicos.

    O acesso ao navegador é poderoso, mas não significa "fazer tudo o que um humano pode" - anti-bot, CAPTCHAs e MFA ainda podem
    bloquear automação. Para o controle de navegador mais confiável, use Chrome MCP local no host
    ou use CDP na máquina que realmente executa o navegador.

    Configuração de melhores práticas:

    - Host do Gateway sempre ativo (VPS/Mac mini).
    - Um agente por função (bindings).
    - Canal(is) Slack vinculados a esses agentes.
    - Navegador local via Chrome MCP ou um node quando necessário.

    Documentação: [Roteamento de múltiplos agentes](/pt-BR/concepts/multi-agent), [Slack](/pt-BR/channels/slack),
    [Navegador](/pt-BR/tools/browser), [Nodes](/pt-BR/nodes).

  </Accordion>
</AccordionGroup>

## Modelos, failover e perfis de autenticação

Perguntas e respostas sobre modelos — padrões, seleção, aliases, troca, failover, perfis de autenticação —
foram movidas para uma página dedicada:
[FAQ — modelos e perfis de autenticação](/pt-BR/help/faq-models).

## Gateway: portas, "already running" e modo remoto

<AccordionGroup>
  <Accordion title="Que porta o Gateway usa?">
    `gateway.port` controla a única porta multiplexada para WebSocket + HTTP (Control UI, hooks etc.).

    Precedência:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > padrão 18789
    ```

  </Accordion>

  <Accordion title='Por que openclaw gateway status diz "Runtime: running", mas "Connectivity probe: failed"?'>
    Porque "running" é a visão do **supervisor** (launchd/systemd/schtasks). A connectivity probe é a CLI realmente se conectando ao WebSocket do gateway.

    Use `openclaw gateway status` e confie nestas linhas:

    - `Probe target:` (a URL que a sonda realmente usou)
    - `Listening:` (o que realmente está vinculado na porta)
    - `Last gateway error:` (causa raiz comum quando o processo está vivo, mas a porta não está escutando)

  </Accordion>

  <Accordion title='Por que openclaw gateway status mostra "Config (cli)" e "Config (service)" diferentes?'>
    Você está editando um arquivo de configuração enquanto o serviço está executando outro (muitas vezes uma incompatibilidade de `--profile` / `OPENCLAW_STATE_DIR`).

    Correção:

    ```bash
    openclaw gateway install --force
    ```

    Execute isso a partir do mesmo `--profile` / ambiente que você quer que o serviço use.

  </Accordion>

  <Accordion title='O que significa "another gateway instance is already listening"?'>
    O OpenClaw impõe um lock de runtime vinculando o listener WebSocket imediatamente na inicialização (padrão `ws://127.0.0.1:18789`). Se o bind falhar com `EADDRINUSE`, ele lança `GatewayLockError`, indicando que outra instância já está escutando.

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
    - O aplicativo macOS observa o arquivo de configuração e troca de modo ao vivo quando esses valores mudam.
    - `gateway.remote.token` / `.password` são apenas credenciais remotas do lado do cliente; elas não ativam autenticação do gateway local por si só.

  </Accordion>

  <Accordion title='A Control UI diz "unauthorized" (ou continua reconectando). E agora?'>
    Seu caminho de autenticação do gateway e o método de autenticação da UI não correspondem.

    Fatos (do código):

    - A Control UI mantém o token em `sessionStorage` para a sessão atual da aba do navegador e a URL de gateway selecionada, então atualizações na mesma aba continuam funcionando sem restaurar persistência de token de longa duração em localStorage.
    - Em `AUTH_TOKEN_MISMATCH`, clientes confiáveis podem tentar uma nova tentativa limitada com um token de dispositivo em cache quando o gateway retorna dicas de nova tentativa (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`).
    - Essa nova tentativa com token em cache agora reutiliza os escopos aprovados em cache armazenados com o token do dispositivo. Chamadores com `deviceToken` explícito / `scopes` explícitos ainda mantêm seu conjunto de escopos solicitado em vez de herdar escopos em cache.
    - Fora desse caminho de nova tentativa, a precedência de autenticação de conexão é: token/senha explícitos primeiro, depois `deviceToken` explícito, depois token de dispositivo armazenado e então token de bootstrap.
    - Verificações de escopo do token de bootstrap usam prefixo de role. A allowlist interna de operador de bootstrap satisfaz apenas solicitações de operador; node ou outras roles que não sejam operador ainda precisam de escopos sob o próprio prefixo de role.

    Correção:

    - Mais rápido: `openclaw dashboard` (imprime + copia a URL do dashboard, tenta abrir; mostra dica de SSH se estiver headless).
    - Se você ainda não tiver um token: `openclaw doctor --generate-gateway-token`.
    - Se for remoto, primeiro crie um túnel: `ssh -N -L 18789:127.0.0.1:18789 user@host` e depois abra `http://127.0.0.1:18789/`.
    - Modo de segredo compartilhado: defina `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` ou `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` e cole o segredo correspondente nas configurações da Control UI.
    - Modo Tailscale Serve: certifique-se de que `gateway.auth.allowTailscale` esteja ativado e que você esteja abrindo a URL do Serve, não uma URL bruta de loopback/tailnet que ignore cabeçalhos de identidade do Tailscale.
    - Modo trusted-proxy: certifique-se de que você está vindo pelo proxy configurado com reconhecimento de identidade fora de loopback, não por um proxy em loopback no mesmo host nem por uma URL bruta do gateway.
    - Se a incompatibilidade persistir após a única nova tentativa, faça rotação/reaprovação do token de dispositivo pareado:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - Se essa chamada de rotação disser que foi negada, verifique duas coisas:
      - sessões de dispositivo pareado só podem rotacionar **seu próprio** dispositivo, a menos que também tenham `operator.admin`
      - valores explícitos de `--scope` não podem exceder os escopos atuais de operador do chamador
    - Ainda travado? Execute `openclaw status --all` e siga [Solução de problemas](/pt-BR/gateway/troubleshooting). Consulte [Dashboard](/pt-BR/web/dashboard) para detalhes de autenticação.

  </Accordion>

  <Accordion title="Defini gateway.bind tailnet, mas ele não consegue vincular e nada escuta">
    O bind `tailnet` escolhe um IP Tailscale das interfaces de rede (100.64.0.0/10). Se a máquina não estiver no Tailscale (ou a interface estiver inativa), não há nada em que vincular.

    Correção:

    - Inicie o Tailscale nesse host (para que ele tenha um endereço 100.x), ou
    - Troque para `gateway.bind: "loopback"` / `"lan"`.

    Observação: `tailnet` é explícito. `auto` prefere loopback; use `gateway.bind: "tailnet"` quando quiser um bind apenas de tailnet.

  </Accordion>

  <Accordion title="Posso executar vários Gateways no mesmo host?">
    Normalmente não - um Gateway pode executar vários canais de mensagens e agentes. Use vários Gateways apenas quando precisar de redundância (ex.: bot de resgate) ou isolamento rígido.

    Sim, mas você precisa isolar:

    - `OPENCLAW_CONFIG_PATH` (configuração por instância)
    - `OPENCLAW_STATE_DIR` (estado por instância)
    - `agents.defaults.workspace` (isolamento de workspace)
    - `gateway.port` (portas exclusivas)

    Configuração rápida (recomendada):

    - Use `openclaw --profile <name> ...` por instância (cria automaticamente `~/.openclaw-<name>`).
    - Defina um `gateway.port` exclusivo na configuração de cada perfil (ou passe `--port` em execuções manuais).
    - Instale um serviço por perfil: `openclaw --profile <name> gateway install`.

    Perfis também recebem sufixo em nomes de serviço (`ai.openclaw.<profile>`; legado `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`).
    Guia completo: [Múltiplos gateways](/pt-BR/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='O que significa "invalid handshake" / código 1008?'>
    O Gateway é um **servidor WebSocket** e espera que a primeira mensagem seja
    um frame `connect`. Se receber qualquer outra coisa, fecha a conexão
    com **código 1008** (violação de política).

    Causas comuns:

    - Você abriu a URL **HTTP** em um navegador (`http://...`) em vez de um cliente WS.
    - Você usou a porta ou caminho errados.
    - Um proxy ou túnel removeu cabeçalhos de autenticação ou enviou uma solicitação que não era do Gateway.

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

## Logging e depuração

<AccordionGroup>
  <Accordion title="Onde ficam os logs?">
    Logs de arquivo (estruturados):

    ```
    /tmp/openclaw/openclaw-YYYY-MM-DD.log
    ```

    Você pode definir um caminho estável via `logging.file`. O nível do log de arquivo é controlado por `logging.level`. A verbosidade do console é controlada por `--verbose` e `logging.consoleLevel`.

    Forma mais rápida de acompanhar logs:

    ```bash
    openclaw logs --follow
    ```

    Logs do serviço/supervisor (quando o gateway é executado via launchd/systemd):

    - macOS: `$OPENCLAW_STATE_DIR/logs/gateway.log` e `gateway.err.log` (padrão: `~/.openclaw/logs/...`; perfis usam `~/.openclaw-<profile>/logs/...`)
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    Consulte [Solução de problemas](/pt-BR/gateway/troubleshooting) para mais detalhes.

  </Accordion>

  <Accordion title="Como inicio/parar/reinicio o serviço do Gateway?">
    Use os auxiliares do gateway:

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    Se você executar o gateway manualmente, `openclaw gateway --force` pode recuperar a porta. Consulte [Gateway](/pt-BR/gateway).

  </Accordion>

  <Accordion title="Fechei meu terminal no Windows - como reinicio o OpenClaw?">
    Há **dois modos de instalação no Windows**:

    **1) WSL2 (recomendado):** o Gateway é executado dentro do Linux.

    Abra o PowerShell, entre no WSL e depois reinicie:

    ```powershell
    wsl
    openclaw gateway status
    openclaw gateway restart
    ```

    Se você nunca instalou o serviço, inicie-o em primeiro plano:

    ```bash
    openclaw gateway run
    ```

    **2) Windows nativo (não recomendado):** o Gateway é executado diretamente no Windows.

    Abra o PowerShell e execute:

    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```

    Se você o executar manualmente (sem serviço), use:

    ```powershell
    openclaw gateway run
    ```

    Documentação: [Windows (WSL2)](/pt-BR/platforms/windows), [Runbook do serviço Gateway](/pt-BR/gateway).

  </Accordion>

  <Accordion title="O Gateway está ativo, mas as respostas nunca chegam. O que devo verificar?">
    Comece com uma verificação rápida de integridade:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    Causas comuns:

    - Autenticação do modelo não carregada no **host do gateway** (verifique `models status`).
    - Pareamento/allowlist do canal bloqueando respostas (verifique a configuração do canal + logs).
    - WebChat/Dashboard aberto sem o token correto.

    Se você estiver remoto, confirme que a conexão do túnel/Tailscale está ativa e que o
    WebSocket do Gateway está acessível.

    Documentação: [Canais](/pt-BR/channels), [Solução de problemas](/pt-BR/gateway/troubleshooting), [Acesso remoto](/pt-BR/gateway/remote).

  </Accordion>

  <Accordion title='"Disconnected from gateway: no reason" - e agora?'>
    Isso geralmente significa que a UI perdeu a conexão WebSocket. Verifique:

    1. O Gateway está em execução? `openclaw gateway status`
    2. O Gateway está íntegro? `openclaw status`
    3. A UI tem o token correto? `openclaw dashboard`
    4. Se for remoto, o link de túnel/Tailscale está ativo?

    Depois acompanhe os logs:

    ```bash
    openclaw logs --follow
    ```

    Documentação: [Dashboard](/pt-BR/web/dashboard), [Acesso remoto](/pt-BR/gateway/remote), [Solução de problemas](/pt-BR/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Telegram setMyCommands falha. O que devo verificar?">
    Comece pelos logs e pelo status do canal:

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    Depois compare o erro:

    - `BOT_COMMANDS_TOO_MUCH`: o menu do Telegram tem entradas demais. O OpenClaw já reduz até o limite do Telegram e tenta novamente com menos comandos, mas algumas entradas ainda precisam ser removidas. Reduza comandos de Plugin/Skill/personalizados ou desative `channels.telegram.commands.native` se não precisar do menu.
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!` ou erros de rede semelhantes: se você estiver em uma VPS ou atrás de um proxy, confirme que HTTPS de saída está liberado e que o DNS funciona para `api.telegram.org`.

    Se o Gateway for remoto, certifique-se de estar olhando os logs no host do Gateway.

    Documentação: [Telegram](/pt-BR/channels/telegram), [Solução de problemas de canal](/pt-BR/channels/troubleshooting).

  </Accordion>

  <Accordion title="A TUI não mostra saída. O que devo verificar?">
    Primeiro confirme se o Gateway está acessível e se o agente consegue executar:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    Na TUI, use `/status` para ver o estado atual. Se você espera respostas em um
    canal de chat, certifique-se de que a entrega esteja ativada (`/deliver on`).

    Documentação: [TUI](/pt-BR/web/tui), [Comandos com barra](/pt-BR/tools/slash-commands).

  </Accordion>

  <Accordion title="Como faço para parar completamente e depois iniciar o Gateway?">
    Se você instalou o serviço:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    Isso para/inicia o **serviço supervisionado** (launchd no macOS, systemd no Linux).
    Use isso quando o Gateway estiver em execução em segundo plano como daemon.

    Se você estiver executando em primeiro plano, pare com Ctrl-C e depois:

    ```bash
    openclaw gateway run
    ```

    Documentação: [Runbook do serviço Gateway](/pt-BR/gateway).

  </Accordion>

  <Accordion title="ELI5: openclaw gateway restart vs openclaw gateway">
    - `openclaw gateway restart`: reinicia o **serviço em segundo plano** (launchd/systemd).
    - `openclaw gateway`: executa o gateway **em primeiro plano** nesta sessão do terminal.

    Se você instalou o serviço, use os comandos de gateway. Use `openclaw gateway` quando
    quiser uma execução única em primeiro plano.

  </Accordion>

  <Accordion title="Forma mais rápida de obter mais detalhes quando algo falha">
    Inicie o Gateway com `--verbose` para obter mais detalhes no console. Depois inspecione o arquivo de log em busca de autenticação de canal, roteamento de modelo e erros de RPC.
  </Accordion>
</AccordionGroup>

## Mídia e anexos

<AccordionGroup>
  <Accordion title="Minha Skill gerou uma imagem/PDF, mas nada foi enviado">
    Anexos de saída do agente devem incluir uma linha `MEDIA:<path-or-url>` (em sua própria linha). Consulte [Configuração do assistente OpenClaw](/pt-BR/start/openclaw) e [Agent send](/pt-BR/tools/agent-send).

    Envio via CLI:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    Verifique também:

    - O canal de destino é compatível com mídia de saída e não está bloqueado por allowlists.
    - O arquivo está dentro dos limites de tamanho do provedor (imagens são redimensionadas para no máximo 2048px).
    - `tools.fs.workspaceOnly=true` mantém envios de caminhos locais limitados ao workspace, temp/media-store e arquivos validados pelo sandbox.
    - `tools.fs.workspaceOnly=false` permite que `MEDIA:` envie arquivos locais do host que o agente já pode ler, mas apenas para mídia mais tipos seguros de documento (imagens, áudio, vídeo, PDF e documentos do Office). Texto simples e arquivos semelhantes a segredos continuam bloqueados.

    Consulte [Imagens](/pt-BR/nodes/images).

  </Accordion>
</AccordionGroup>

## Segurança e controle de acesso

<AccordionGroup>
  <Accordion title="É seguro expor o OpenClaw a DMs recebidas?">
    Trate DMs recebidas como entrada não confiável. Os padrões são projetados para reduzir risco:

    - O comportamento padrão em canais compatíveis com DM é **pairing**:
      - Remetentes desconhecidos recebem um código de pareamento; o bot não processa a mensagem deles.
      - Aprove com: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - Solicitações pendentes são limitadas a **3 por canal**; verifique `openclaw pairing list --channel <channel> [--account <id>]` se um código não chegou.
    - Abrir DMs publicamente exige opt-in explícito (`dmPolicy: "open"` e allowlist `"*"`).

    Execute `openclaw doctor` para revelar políticas de DM arriscadas.

  </Accordion>

  <Accordion title="Prompt injection é uma preocupação apenas para bots públicos?">
    Não. Prompt injection diz respeito a **conteúdo não confiável**, não apenas a quem pode enviar DM ao bot.
    Se seu assistente lê conteúdo externo (web search/fetch, páginas do navegador, e-mails,
    documentos, anexos, logs colados), esse conteúdo pode incluir instruções que tentam
    sequestrar o modelo. Isso pode acontecer mesmo que **você seja o único remetente**.

    O maior risco é quando ferramentas estão ativadas: o modelo pode ser induzido a
    exfiltrar contexto ou chamar ferramentas em seu nome. Reduza o raio de impacto:

    - usando um agente "leitor" somente leitura ou sem ferramentas para resumir conteúdo não confiável
    - mantendo `web_search` / `web_fetch` / `browser` desativados para agentes com ferramentas ativadas
    - tratando também texto decodificado de arquivos/documentos como não confiável: `input_file`
      do OpenResponses e extração de anexos de mídia envolvem o texto extraído em
      marcadores explícitos de limite de conteúdo externo em vez de passar texto bruto do arquivo
    - usando sandboxing e allowlists rígidas de ferramentas

    Detalhes: [Segurança](/pt-BR/gateway/security).

  </Accordion>

  <Accordion title="Meu bot deve ter seu próprio e-mail, conta GitHub ou número de telefone?">
    Sim, para a maioria das configurações. Isolar o bot com contas e números de telefone
    separados reduz o raio de impacto se algo der errado. Isso também facilita rotacionar
    credenciais ou revogar acesso sem afetar suas contas pessoais.

    Comece pequeno. Dê acesso apenas às ferramentas e contas de que você realmente precisa e expanda
    depois, se necessário.

    Documentação: [Segurança](/pt-BR/gateway/security), [Pareamento](/pt-BR/channels/pairing).

  </Accordion>

  <Accordion title="Posso dar autonomia sobre minhas mensagens de texto e isso é seguro?">
    **Não** recomendamos autonomia total sobre suas mensagens pessoais. O padrão mais seguro é:

    - Manter DMs em **modo pairing** ou em uma allowlist restrita.
    - Usar um **número ou conta separados** se quiser que ele envie mensagens em seu nome.
    - Deixar que ele redija e depois **aprovar antes de enviar**.

    Se você quiser experimentar, faça isso em uma conta dedicada e mantenha-a isolada. Consulte
    [Segurança](/pt-BR/gateway/security).

  </Accordion>

  <Accordion title="Posso usar modelos mais baratos para tarefas de assistente pessoal?">
    Sim, **desde que** o agente seja apenas de chat e a entrada seja confiável. Níveis menores são
    mais suscetíveis a sequestro por instrução, então evite-os para agentes com ferramentas ativadas
    ou ao ler conteúdo não confiável. Se precisar usar um modelo menor, restrinja
    ferramentas e execute dentro de um sandbox. Consulte [Segurança](/pt-BR/gateway/security).
  </Accordion>

  <Accordion title="Executei /start no Telegram, mas não recebi um código de pareamento">
    Códigos de pareamento são enviados **somente** quando um remetente desconhecido envia mensagem ao bot e
    `dmPolicy: "pairing"` está ativado. `/start` sozinho não gera um código.

    Verifique solicitações pendentes:

    ```bash
    openclaw pairing list telegram
    ```

    Se você quiser acesso imediato, coloque seu ID de remetente na allowlist ou defina `dmPolicy: "open"`
    para essa conta.

  </Accordion>

  <Accordion title="WhatsApp: ele enviará mensagens aos meus contatos? Como funciona o pareamento?">
    Não. A política padrão de DM no WhatsApp é **pairing**. Remetentes desconhecidos recebem apenas um código de pareamento e a mensagem deles **não é processada**. O OpenClaw só responde a chats que recebe ou a envios explícitos que você aciona.

    Aprove o pareamento com:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    Liste solicitações pendentes:

    ```bash
    openclaw pairing list whatsapp
    ```

    Prompt do número de telefone no assistente: ele é usado para definir sua **allowlist/proprietário** para que suas próprias DMs sejam permitidas. Não é usado para envio automático. Se você executa no seu número pessoal do WhatsApp, use esse número e ative `channels.whatsapp.selfChatMode`.

  </Accordion>
</AccordionGroup>

## Comandos de chat, interrupção de tarefas e "ele não para"

<AccordionGroup>
  <Accordion title="Como faço para impedir que mensagens internas do sistema apareçam no chat?">
    A maioria das mensagens internas ou de ferramentas só aparece quando **verbose**, **trace** ou **reasoning** estão ativados
    para essa sessão.

    Corrija no chat em que você vê isso:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    Se ainda estiver barulhento, verifique as configurações da sessão na Control UI e defina verbose
    como **inherit**. Também confirme que você não está usando um perfil de bot com `verboseDefault` definido
    como `on` na configuração.

    Documentação: [Thinking and verbose](/pt-BR/tools/thinking), [Segurança](/pt-BR/gateway/security#reasoning-verbose-output-in-groups).

  </Accordion>

  <Accordion title="Como paro/cancelo uma tarefa em execução?">
    Envie qualquer uma destas opções **como mensagem independente** (sem barra):

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

    Esses são gatilhos de interrupção (não comandos com barra).

    Para processos em segundo plano (da ferramenta exec), você pode pedir ao agente para executar:

    ```
    process action:kill sessionId:XXX
    ```

    Visão geral de comandos com barra: consulte [Comandos com barra](/pt-BR/tools/slash-commands).

    A maioria dos comandos deve ser enviada como mensagem **independente** que começa com `/`, mas alguns atalhos (como `/status`) também funcionam inline para remetentes na allowlist.

  </Accordion>

  <Accordion title='Como envio uma mensagem do Discord a partir do Telegram? ("Cross-context messaging denied")'>
    O OpenClaw bloqueia mensagens **entre provedores** por padrão. Se uma chamada de ferramenta estiver vinculada
    ao Telegram, ela não enviará ao Discord, a menos que você permita isso explicitamente.

    Ative mensagens entre provedores para o agente:

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

    Reinicie o gateway após editar a configuração.

  </Accordion>

  <Accordion title='Por que parece que o bot "ignora" mensagens enviadas rapidamente em sequência?'>
    O modo de fila controla como novas mensagens interagem com uma execução em andamento. Use `/queue` para trocar de modo:

    - `steer` - novas mensagens redirecionam a tarefa atual
    - `followup` - executa mensagens uma por vez
    - `collect` - agrupa mensagens e responde uma vez (padrão)
    - `steer-backlog` - redireciona agora e depois processa o backlog
    - `interrupt` - aborta a execução atual e começa uma nova

    Você pode adicionar opções como `debounce:2s cap:25 drop:summarize` para modos de followup.

  </Accordion>
</AccordionGroup>

## Diversos

<AccordionGroup>
  <Accordion title='Qual é o modelo padrão da Anthropic com uma chave de API?'>
    No OpenClaw, credenciais e seleção de modelo são separadas. Definir `ANTHROPIC_API_KEY` (ou armazenar uma chave de API da Anthropic em perfis de autenticação) ativa a autenticação, mas o modelo padrão real é aquele que você configura em `agents.defaults.model.primary` (por exemplo, `anthropic/claude-sonnet-4-6` ou `anthropic/claude-opus-4-6`). Se você vir `No credentials found for profile "anthropic:default"`, isso significa que o Gateway não conseguiu encontrar credenciais da Anthropic no `auth-profiles.json` esperado para o agente em execução.
  </Accordion>
</AccordionGroup>

---

Ainda está travado? Pergunte no [Discord](https://discord.com/invite/clawd) ou abra uma [discussão no GitHub](https://github.com/openclaw/openclaw/discussions).

## Relacionado

- [FAQ — início rápido e configuração da primeira execução](/pt-BR/help/faq-first-run)
- [FAQ — modelos e perfis de autenticação](/pt-BR/help/faq-models)
- [Solução de problemas](/pt-BR/help/troubleshooting)
