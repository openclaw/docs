---
read_when:
    - Você quer um guia passo a passo da TUI para iniciantes
    - Você precisa da lista completa de recursos, comandos e atalhos da TUI
summary: 'Interface de terminal (TUI): conecte-se ao Gateway ou execute localmente no modo incorporado'
title: TUI
x-i18n:
    generated_at: "2026-07-12T00:29:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d7181ea88643a129532f698908fd3dd3d93078b7e33b0ab1166dcfca2ecc2abd
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

Use `--password` se o seu Gateway usar autenticação por senha.

### Modo local

Execute a TUI sem um Gateway:

```bash
openclaw chat
# ou
openclaw tui --local
```

- `openclaw chat` e `openclaw terminal` são aliases de `openclaw tui --local`.
- `--local` não pode ser combinado com `--url`, `--token` ou `--password`.
- O modo local usa diretamente o runtime de agente incorporado. A maioria das ferramentas locais funciona, mas os recursos exclusivos do Gateway ficam indisponíveis.
- `openclaw` sem argumentos (sem subcomando) escolhe um destino automaticamente: uma instalação não configurada inicia a integração guiada de inferência; uma configuração inválida abre as orientações clássicas do Doctor; um Gateway configurado e acessível abre este shell da TUI no modo Gateway; caso contrário, um modelo local configurado o abre no modo local.

## O que você vê

- Cabeçalho: URL da conexão, agente atual e sessão atual.
- Registro do chat: mensagens do usuário, respostas do assistente, avisos do sistema e cartões de ferramentas.
- Linha de status: estado da conexão/execução (conectando, executando, transmitindo, ocioso, erro).
- Rodapé: agente + sessão + modelo + estado do objetivo + raciocínio/rápido/detalhado/rastreamento/justificativa + contagens de tokens + entrega. Quando `tui.footer.showRemoteHost` está habilitado, as conexões remotas com o Gateway também mostram o host da conexão.
- Entrada: editor de texto com preenchimento automático.

## Modelo mental: agentes + sessões

- Os agentes são identificadores curtos exclusivos (por exemplo, `main`, `research`). O Gateway disponibiliza a lista.
- As sessões pertencem ao agente atual.
- As chaves de sessão são armazenadas como `agent:<agentId>:<sessionKey>`.
  - Se você digitar `/session main`, a TUI expandirá para `agent:<currentAgent>:main`.
  - Se você digitar `/session agent:other:main`, mudará explicitamente para a sessão desse agente.
- Escopo da sessão:
  - `per-sender` (padrão): cada agente tem várias sessões.
  - `global`: a TUI sempre usa a sessão `global` (o seletor pode ficar vazio).
- O agente e a sessão atuais ficam sempre visíveis no rodapé.
- Para mostrar o host do Gateway em conexões não locais baseadas em URL, habilite a opção com:

  ```bash
  openclaw config set tui.footer.showRemoteHost true
  ```

  O padrão é `false`. Conexões local loopback e locais incorporadas nunca mostram um rótulo de host.

- Se a sessão tiver um [objetivo](/pt-BR/tools/goal), o rodapé mostrará seu estado compacto:
  `Perseguindo objetivo`, `Objetivo pausado (/goal resume)`, `Objetivo bloqueado (/goal resume)` ou `Objetivo alcançado`.
- Quando iniciada sem `--session`, a TUI no modo Gateway retoma a última sessão selecionada para o mesmo gateway, agente e escopo de sessão, se essa sessão ainda existir. O uso de `--session`, `/session`, `/new` ou `/reset` continua sendo explícito.

## Envio + entrega

- As mensagens sempre vão para o Gateway (ou para o runtime incorporado no modo local); entregar a resposta do assistente de volta a um provedor de chat é uma etapa separada e desabilitada por padrão.
- A TUI é uma superfície de origem interna como o WebChat, não um canal genérico de saída. Ambientes que exigem `tools.message` para respostas visíveis podem atender à interação ativa da TUI com um `message.send` sem destino; a entrega explícita pelo provedor continua usando os canais normalmente configurados e nunca recorre a `lastChannel`.
- A entrega é definida para toda a sessão da TUI no momento da inicialização: inicie com `openclaw tui --deliver` para ativá-la. Não há comando de barra `/deliver` nem opção em Configurações para alterá-la durante a sessão; reinicie a TUI para mudar essa configuração.

## Seletores + sobreposições

- Seletor de modelos: lista os modelos disponíveis e define a substituição para a sessão.
- Seletor de agentes: escolhe um agente diferente.
- Seletor de sessões: mostra até 50 sessões do agente atual que foram atualizadas nos últimos 7 dias. Use `/session <key>` para acessar uma sessão conhecida mais antiga.
- Configurações (`/settings`): alterna a expansão da saída das ferramentas e a visibilidade do raciocínio. Este painel não controla a entrega.

## Atalhos de teclado

- Enter: enviar mensagem
- Esc: interromper a execução ativa
- Ctrl+C: limpar a entrada (pressione duas vezes para sair)
- Ctrl+D: sair
- Ctrl+L: seletor de modelos
- Ctrl+G: seletor de agentes
- Ctrl+P: seletor de sessões
- Ctrl+O: alternar a expansão da saída das ferramentas
- Ctrl+T: alternar a visibilidade do raciocínio (recarrega o histórico)

## Comandos de barra

Principais:

- `/help`
- `/status` (encaminhado ao Gateway; mostra um resumo da sessão e do modelo)
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

- `/new` (cria uma nova sessão isolada com uma nova chave; não afeta outros clientes da TUI na sessão antiga)
- `/reset` (redefine a chave da sessão atual no local)
- `/abort` (interrompe a execução ativa)
- `/settings`
- `/exit` (ou `/quit`)

Somente no modo local:

- `/auth [provider]` abre o fluxo de autenticação/login do provedor dentro da TUI.

Crestodian:

- `/crestodian [request]` retorna da TUI normal do agente para o chat de configuração/reparo do [Crestodian](#crestodian-setup-and-repair-helper), encaminhando opcionalmente uma solicitação.

Outros comandos de barra do Gateway (por exemplo, `/context`) são encaminhados ao Gateway e exibidos como saída do sistema. Consulte [Comandos de barra](/pt-BR/tools/slash-commands).

## Comandos locais do shell

- Prefixe uma linha com `!` para executar um comando local do shell no host da TUI.
- A TUI solicita uma vez por sessão a permissão para execução local; se você recusar, `!` continuará desabilitado durante a sessão.
- Os comandos são executados em um shell novo e não interativo, no diretório de trabalho da TUI (sem persistência de `cd`/variáveis de ambiente).
- Os comandos locais do shell recebem `OPENCLAW_SHELL=tui-local` em seu ambiente.
- Um `!` isolado é enviado como uma mensagem normal; espaços iniciais não acionam a execução local.

## Assistente Crestodian de configuração e reparo

O Crestodian é o assistente de configuração/reparo de nível zero, disponibilizado como `openclaw crestodian` após o modelo padrão configurado passar por uma verificação de inferência em tempo real. Se a inferência estiver indisponível, uma invocação interativa retornará à integração guiada de inferência e a automação falhará com orientações de reparo. Ele é executado no mesmo shell local da TUI usado por `openclaw tui --local`, com suporte de um agente de IA restrito às operações tipadas do Crestodian e sujeitas a aprovação:

```bash
openclaw crestodian                       # iniciar interativamente
openclaw crestodian -m "status"           # executar uma solicitação e sair
openclaw crestodian -m "set default model openai/gpt-5.2" --yes   # aplicar uma gravação de configuração
```

- Gravações persistentes de configuração exigem aprovação: confirme interativamente ou passe `--yes`.
- `--json` imprime a visão geral da inicialização como JSON em vez de iniciar o chat.
- De dentro do Crestodian, uma solicitação `open-tui` (por exemplo, pedir para conversar com um agente normal) encerra o Crestodian e abre a TUI normal do agente; use `/crestodian` nela para voltar.

Use o modo local quando a configuração atual já for válida e você quiser que o agente incorporado a inspecione na mesma máquina, compare-a com a documentação e ajude a corrigir divergências sem depender de um Gateway em execução.

Se `openclaw config validate` já estiver falhando, comece primeiro com `openclaw configure` ou `openclaw doctor --fix`; `openclaw chat` ainda precisa de uma configuração carregável para iniciar.

Fluxo típico:

1. Inicie o modo local:

```bash
openclaw chat
```

2. Peça ao agente o que você deseja verificar, por exemplo:

```text
Compare minha configuração de autenticação do gateway com a documentação e sugira a menor correção.
```

3. Use comandos locais do shell para obter evidências exatas e fazer a validação:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

4. Aplique alterações pontuais com `openclaw config set` ou `openclaw configure` e execute novamente `!openclaw config validate`.
5. Se o Doctor recomendar uma migração ou um reparo automático, revise a recomendação e execute `!openclaw doctor --fix`.

Dicas:

- Prefira `openclaw config set` ou `openclaw configure` em vez de editar `openclaw.json` manualmente.
- `openclaw docs "<query>"` pesquisa o índice da documentação atual na mesma máquina.
- `openclaw config validate --json` é útil quando você deseja erros estruturados de esquema e de resolução/SecretRef.

## Saída das ferramentas

- As chamadas de ferramentas são exibidas como cartões com argumentos + resultados.
- Ctrl+O alterna entre as visualizações recolhida e expandida.
- Enquanto as ferramentas são executadas, atualizações parciais são transmitidas para o mesmo cartão.

## Cores do terminal

- A TUI mantém o texto principal do assistente na cor padrão de primeiro plano do terminal, garantindo a legibilidade em terminais claros e escuros.
- Se o seu terminal usar um fundo claro e a detecção automática estiver incorreta, defina `OPENCLAW_THEME=light` antes de iniciar `openclaw tui`.
- Para forçar a paleta escura original, defina `OPENCLAW_THEME=dark`.

## Histórico + transmissão

- Ao se conectar, a TUI carrega o histórico mais recente (por padrão, 200 mensagens).
- As respostas transmitidas são atualizadas no local até serem concluídas.
- A TUI também monitora eventos de ferramentas do agente para apresentar cartões de ferramentas mais completos.

## Detalhes da conexão

- A TUI se conecta com o ID de cliente `openclaw-tui` no modo genérico de cliente `ui` (o mesmo modo usado pela Control UI e pelo WebChat para a política do Gateway).
- Reconexões exibem uma mensagem do sistema; lacunas de eventos são indicadas no registro.

## Opções

- `--local`: executar com o runtime local do agente incorporado
- `--url <url>`: URL WebSocket do Gateway (por padrão, usa `gateway.remote.url` da configuração ou `ws://127.0.0.1:<port>` em local loopback)
- `--token <token>`: token do Gateway (se necessário)
- `--password <password>`: senha do Gateway (se necessária)
- `--tls-fingerprint <sha256>`: impressão digital esperada do certificado TLS para um Gateway `wss://` fixado
- `--session <key>`: chave da sessão (padrão: `main`, ou `global` quando o escopo é global)
- `--deliver`: entregar as respostas do assistente ao provedor (desabilitado por padrão)
- `--thinking <level>`: substituir o nível de raciocínio dos envios
- `--message <text>`: enviar uma mensagem inicial após a conexão
- `--timeout-ms <ms>`: tempo limite do agente em ms (por padrão, usa `agents.defaults.timeoutSeconds`)
- `--history-limit <n>`: quantidade de entradas do histórico a carregar (padrão: `200`)

<Warning>
Quando você define `--url`, a TUI não recorre às credenciais da configuração nem às variáveis de ambiente. Passe `--token` ou `--password` explicitamente, além de `--tls-fingerprint` quando o destino usar um certificado fixado. A ausência de credenciais explícitas é um erro. No modo local, não passe `--url`, `--token`, `--password` nem `--tls-fingerprint`.
</Warning>

## Solução de problemas

Nenhuma saída após o envio de uma mensagem:

- Execute `/status` na TUI para confirmar que o Gateway está conectado e ocioso/ocupado.
- Verifique os registros do Gateway: `openclaw logs --follow`.
- Confirme que o agente consegue ser executado: `openclaw status` e `openclaw models status`.
- Se você espera mensagens em um canal de chat, confirme que a TUI foi iniciada com `--deliver` (não é possível ativar essa opção posteriormente sem reiniciar).

## Solução de problemas de conexão

- `disconnected`: verifique se o Gateway está em execução e se seus valores de `--url/--token/--password` estão corretos.
- Nenhum agente no seletor: verifique `openclaw agents list` e sua configuração de roteamento.
- Seletor de sessões vazio: você pode estar no escopo global ou ainda não ter sessões.

## Conteúdo relacionado

- [Control UI](/pt-BR/web/control-ui) — interface de controle baseada na web
- [Configuração](/pt-BR/cli/config) — inspecionar, validar e editar `openclaw.json`
- [Doctor](/pt-BR/cli/doctor) — verificações guiadas de reparo e migração
- [Referência da CLI](/pt-BR/cli) — referência completa dos comandos da CLI
