---
read_when:
    - Você quer um guia passo a passo da TUI para iniciantes
    - Você precisa da lista completa de recursos, comandos e atalhos da TUI
summary: 'Interface de usuário do terminal (TUI): conecte-se ao Gateway ou execute localmente no modo incorporado'
title: TUI
x-i18n:
    generated_at: "2026-07-16T12:58:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 1e171520c24d95ac1d6df28227efea0a1258a0b9e59b61fe02c09a2d87b24391
    source_path: web/tui.md
    workflow: 16
---

## Início rápido

### Modo Gateway

1. Inicie o Gateway.

```bash
openclaw gateway
```

2. Abra a TUI.

```bash
openclaw tui
```

3. Digite uma mensagem e pressione Enter.

Gateway remoto:

```bash
openclaw tui --url ws://<host>:<port> --token <gateway-token>
```

Use `--password` se o Gateway usar autenticação por senha.

### Modo local

Execute a TUI sem um Gateway:

```bash
openclaw chat
# ou
openclaw tui --local
```

- `openclaw chat` e `openclaw terminal` são aliases de `openclaw tui --local`.
- `--local` não pode ser combinado com `--url`, `--token` ou `--password`.
- O modo local usa diretamente o runtime do agente incorporado. A maioria das ferramentas locais funciona, mas os recursos exclusivos do Gateway não ficam disponíveis.
- O comando `openclaw` isolado (sem subcomando) escolhe um destino automaticamente: uma instalação não configurada executa a integração inicial de inferência; uma configuração inválida abre as orientações clássicas do Doctor; um Gateway configurado e acessível abre este shell da TUI no modo Gateway; caso contrário, um modelo local configurado o abre no modo local.

## O que é exibido

- Cabeçalho: URL da conexão, agente atual, sessão atual.
- Registro do chat: mensagens do usuário, respostas do assistente, avisos do sistema, cartões de ferramentas.
- Linha de status: estado da conexão/execução (conectando, executando, transmitindo, ocioso, erro).
- Rodapé: agente + sessão + modelo + estado do objetivo + reflexão/rápido/detalhado/rastreamento/raciocínio + contagens de tokens + entrega. Quando `tui.footer.showRemoteHost` está habilitado, as conexões remotas do Gateway também mostram o host da conexão.
- Entrada: editor de texto com preenchimento automático.

## Modelo mental: agentes + sessões

- Os agentes são slugs exclusivos (por exemplo, `main`, `research`). O Gateway disponibiliza a lista.
- As sessões pertencem ao agente atual.
- As chaves de sessão são armazenadas como `agent:<agentId>:<sessionKey>`.
  - Se você digitar `/session main`, a TUI o expandirá para `agent:<currentAgent>:main`.
  - Se você digitar `/session agent:other:main`, mudará explicitamente para a sessão desse agente.
- Escopo da sessão:
  - `per-sender` (padrão): cada agente tem várias sessões.
  - `global`: a TUI sempre usa a sessão `global` (o seletor pode estar vazio).
- O agente e a sessão atuais ficam sempre visíveis no rodapé.
- Para mostrar o host do Gateway em conexões não locais baseadas em URL, habilite a opção com:

  ```bash
  openclaw config set tui.footer.showRemoteHost true
  ```

  O padrão é `false`. Conexões de loopback e conexões locais incorporadas nunca mostram um rótulo de host.

- Se a sessão tiver um [objetivo](/pt-BR/tools/goal), o rodapé mostrará seu estado compacto:
  `Pursuing goal`, `Goal paused (/goal resume)`, `Goal blocked (/goal resume)` ou `Goal achieved`.
- Quando iniciada sem `--session`, a TUI no modo Gateway retoma a última sessão selecionada para o mesmo Gateway, agente e escopo de sessão, caso essa sessão ainda exista. O uso de `--session`, `/session`, `/new` ou `/reset` permanece explícito.

## Envio + entrega

- As mensagens sempre são enviadas ao Gateway (ou ao runtime incorporado no modo local); entregar de volta a resposta do assistente a um provedor de chat é uma etapa separada e desabilitada por padrão.
- A TUI é uma superfície de origem interna, como o WebChat, e não um canal de saída genérico. Harnesses que exigem `tools.message` para respostas visíveis podem atender à interação ativa da TUI com um `message.send` sem destino; a entrega explícita pelo provedor continua usando os canais configurados normalmente e nunca recorre a `lastChannel`.
- A entrega é definida para toda a sessão da TUI na inicialização: inicie com `openclaw tui --deliver` para ativá-la. Não há comando de barra `/deliver` nem opção em Configurações para alterá-la durante a sessão; reinicie a TUI para modificá-la.

## Seletores + sobreposições

- Seletor de modelos: lista os modelos disponíveis e define a substituição da sessão.
- Seletor de agentes: escolhe outro agente.
- Seletor de sessões: mostra até 50 sessões do agente atual atualizadas nos últimos 7 dias. Use `/session <key>` para acessar uma sessão conhecida mais antiga.
- Configurações (`/settings`): alterna a expansão da saída das ferramentas e a visibilidade da reflexão. Este painel não controla a entrega.

## Atalhos de teclado

- Enter: enviar mensagem
- Esc: interromper a execução ativa
- Ctrl+C: limpar a entrada (pressione duas vezes para sair)
- Ctrl+D: sair
- Ctrl+L: seletor de modelos
- Ctrl+G: seletor de agentes
- Ctrl+P: seletor de sessões
- Ctrl+O: alternar a expansão da saída das ferramentas
- Ctrl+T: alternar a visibilidade da reflexão (recarrega o histórico)

## Comandos de barra

Principais:

- `/help`
- `/status` (encaminhado ao Gateway; mostra um resumo da sessão/do modelo)
- `/gateway-status` (alias `/gwstatus`; mostra diretamente o status da conexão com o Gateway)
- `/agent <id>` (ou `/agents`)
- `/session <key>` (ou `/sessions`)
- `/model <provider/model>` (ou `/models`)

Controles da sessão:

- `/think <off|minimal|low|medium|high>` (níveis superiores podem adicionar opções como `xhigh`/`max`, dependendo do modelo)
- `/fast <status|auto|on|off>`
- `/verbose <on|full|off>`
- `/trace <on|off>`
- `/reasoning <on|off|stream>`
- `/usage <off|tokens|full|reset>` (`reset`/`inherit`/`clear`/`default` remove a substituição da sessão)
- `/goal [status] | /goal start <objective> | /goal edit <objective> | /goal pause|resume|complete|block|clear`
- `/elevated <on|off|ask|full>` (alias: `/elev`)
- `/activation <mention|always>`

Ciclo de vida da sessão:

- `/new` (cria uma nova sessão isolada sob uma nova chave; não afeta outros clientes da TUI na sessão antiga)
- `/reset` (redefine no lugar a chave da sessão atual)
- `/abort` (interrompe a execução ativa)
- `/settings`
- `/exit` (ou `/quit`)

Somente no modo local:

- `/auth [provider]` abre o fluxo de autenticação/login do provedor dentro da TUI.

OpenClaw:

- `/openclaw [request]` retorna da TUI normal do agente para o chat de configuração/reparo [OpenClaw](#openclaw-setup-and-repair-helper), encaminhando opcionalmente uma solicitação.

Outros comandos de barra do Gateway (por exemplo, `/context`) são encaminhados ao Gateway e exibidos como saída do sistema. Consulte [Comandos de barra](/pt-BR/tools/slash-commands).

## Comandos locais do shell

- Adicione `!` ao início de uma linha para executar um comando local do shell no host da TUI.
- A TUI solicita permissão uma vez por sessão para permitir a execução local; se ela for recusada, `!` permanecerá desabilitado durante a sessão.
- Os comandos são executados em um shell novo e não interativo no diretório de trabalho da TUI (sem `cd`/ambiente persistente).
- Os comandos locais do shell recebem `OPENCLAW_SHELL=tui-local` em seu ambiente.
- Um `!` isolado é enviado como uma mensagem normal; espaços iniciais não acionam a execução local.

## Assistente de configuração e reparo do OpenClaw

O OpenClaw é o assistente de configuração/reparo de nível zero, disponibilizado como `openclaw setup` depois que o modelo padrão configurado passa em uma verificação de inferência em tempo real. Se a inferência não estiver disponível, uma invocação interativa retornará à integração inicial de inferência, e a automação falhará com orientações de reparo. Ele é executado no mesmo shell local da TUI que `openclaw tui --local`, com o suporte de um agente de IA restrito às operações tipadas do OpenClaw, sujeitas a aprovação:

```bash
openclaw setup                       # iniciar interativamente
openclaw setup -m "status"           # executar uma solicitação e sair
openclaw setup -m "set default model openai/gpt-5.2" --yes   # aplicar uma gravação de configuração
```

- Gravações persistentes de configuração exigem aprovação: confirme interativamente ou use `--yes`.
- `--json` imprime a visão geral da inicialização como JSON em vez de iniciar o chat.
- No OpenClaw, uma solicitação `open-tui` (por exemplo, pedir para conversar com um agente normal) fecha o OpenClaw e abre a TUI normal do agente; use `/openclaw` nela para retornar.

Use o modo local quando a configuração atual já for válida e você quiser que o agente incorporado a inspecione na mesma máquina, compare-a com a documentação e ajude a corrigir divergências sem depender de um Gateway em execução.

Se `openclaw config validate` já estiver falhando, comece com `openclaw configure` ou `openclaw doctor --fix`; `openclaw chat` ainda precisa de uma configuração carregável para iniciar.

Fluxo típico:

1. Inicie o modo local:

```bash
openclaw chat
```

2. Peça ao agente para verificar o que você deseja, por exemplo:

```text
Compare a configuração de autenticação do meu Gateway com a documentação e sugira a menor correção.
```

3. Use comandos locais do shell para obter evidências exatas e realizar a validação:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

4. Aplique alterações específicas com `openclaw config set` ou `openclaw configure` e execute `!openclaw config validate` novamente.
5. Se o Doctor recomendar uma migração ou um reparo automático, revise-o e execute `!openclaw doctor --fix`.

Dicas:

- Prefira `openclaw config set` ou `openclaw configure` em vez de editar `openclaw.json` manualmente.
- `openclaw docs "<query>"` pesquisa o índice da documentação ativa na mesma máquina.
- `openclaw config validate --json` é útil quando você deseja ver o esquema estruturado e os erros de SecretRef/resolução.

## Saída das ferramentas

- As chamadas de ferramentas são exibidas como cartões com argumentos + resultados.
- Ctrl+O alterna entre as visualizações recolhida/expandida.
- Enquanto as ferramentas são executadas, atualizações parciais são transmitidas para o mesmo cartão.

## Cores do terminal

- A TUI mantém o texto do corpo das respostas do assistente na cor de primeiro plano padrão do terminal, para que terminais claros e escuros permaneçam legíveis.
- Se o terminal usar um fundo claro e a detecção automática estiver incorreta, defina `OPENCLAW_THEME=light` antes de iniciar `openclaw tui`.
- Para forçar a paleta escura original, defina `OPENCLAW_THEME=dark`.

## Histórico + transmissão

- Ao conectar, a TUI carrega o histórico mais recente (200 mensagens por padrão).
- As respostas transmitidas são atualizadas no mesmo lugar até serem finalizadas.
- A TUI também monitora os eventos das ferramentas do agente para exibir cartões de ferramentas mais detalhados.

## Detalhes da conexão

- A TUI se conecta com o ID de cliente `openclaw-tui` no modo geral de cliente `ui` (o mesmo modo usado pela Control UI e pelo WebChat para a política do Gateway).
- As reconexões exibem uma mensagem do sistema; lacunas nos eventos são indicadas no registro.

## Opções

- `--local`: Executar no runtime local do agente incorporado
- `--url <url>`: URL WebSocket do Gateway (o padrão é `gateway.remote.url` da configuração ou `ws://127.0.0.1:<port>` no loopback)
- `--token <token>`: Token do Gateway (se necessário)
- `--password <password>`: Senha do Gateway (se necessária)
- `--tls-fingerprint <sha256>`: Impressão digital esperada do certificado TLS para um Gateway `wss://` fixado
- `--session <key>`: Chave de sessão (padrão: `main` ou `global` quando o escopo é global)
- `--deliver`: Entregar as respostas do assistente ao provedor (desativado por padrão)
- `--thinking <level>`: Substituir o nível de raciocínio para envios
- `--message <text>`: Enviar uma mensagem inicial após a conexão
- `--timeout-ms <ms>`: Tempo limite do agente em ms (o padrão é `agents.defaults.timeoutSeconds`)
- `--history-limit <n>`: Entradas do histórico a carregar (padrão: `200`)

<Warning>
Ao definir `--url`, a TUI não recorre às credenciais da configuração ou do ambiente. Passe `--token` ou `--password` explicitamente, além de `--tls-fingerprint` quando o destino usar um certificado fixado. A ausência de credenciais explícitas é um erro. No modo local, não passe `--url`, `--token`, `--password` nem `--tls-fingerprint`.
</Warning>

## Solução de problemas

Nenhuma saída após o envio de uma mensagem:

- Execute `/status` na TUI para confirmar que o Gateway está conectado e ocioso/ocupado.
- Verifique os logs do Gateway: `openclaw logs --follow`.
- Confirme que o agente consegue executar: `openclaw status` e `openclaw models status`.
- Se mensagens forem esperadas em um canal de chat, confirme que a TUI foi iniciada com `--deliver` (isso não pode ser ativado posteriormente sem reiniciar).

## Solução de problemas de conexão

- `disconnected`: verifique se o Gateway está em execução e se suas `--url/--token/--password` estão corretas.
- Nenhum agente no seletor: verifique `openclaw agents list` e sua configuração de roteamento.
- Seletor de sessão vazio: talvez o escopo seja global ou ainda não haja sessões.

## Relacionados

- [Interface de controle](/pt-BR/web/control-ui) — interface de controle baseada na Web
- [Configuração](/pt-BR/cli/config) — inspecionar, validar e editar `openclaw.json`
- [Doctor](/pt-BR/cli/doctor) — verificações orientadas de reparo e migração
- [Referência da CLI](/pt-BR/cli) — referência completa dos comandos da CLI
