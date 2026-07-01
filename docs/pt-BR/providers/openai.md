---
read_when:
    - Você quer usar modelos da OpenAI no OpenClaw
    - Você quer autenticação por assinatura do Codex em vez de chaves de API
    - Você precisa de um comportamento mais rigoroso de execução de agentes GPT-5
summary: Use a OpenAI por meio de chaves de API ou assinatura do Codex no OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-07-01T07:55:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7078798b1d73bd1efca4820eae6d3fb6510e802b2c9193d0c135d8ab28c58fca
    source_path: providers/openai.md
    workflow: 16
---

OpenAI fornece APIs de desenvolvedor para modelos GPT, e o Codex também está disponível como um agente de programação em planos ChatGPT por meio dos clientes Codex da OpenAI. O OpenClaw usa um único id de provedor, `openai`, para ambos os formatos de autenticação.

O OpenClaw usa `openai/*` como a rota canônica de modelos OpenAI. Turnos de agente embutidos em modelos OpenAI são executados por padrão pelo runtime nativo do servidor de aplicativo Codex; a autenticação direta por chave de API da OpenAI continua disponível para superfícies OpenAI que não são de agente, como imagens, embeddings, fala e realtime.

- **Modelos de agente** - modelos `openai/*` por meio do runtime Codex; entre com autenticação Codex para uso de assinatura ChatGPT/Codex, ou configure um backup de chave de API da OpenAI compatível com Codex quando você quiser intencionalmente autenticação por chave de API.
- **APIs OpenAI que não são de agente** - acesso direto à OpenAI Platform com cobrança baseada em uso por meio de `OPENAI_API_KEY` ou onboarding por chave de API da OpenAI.
- **Configuração legada** - refs de modelo Codex legadas são reparadas por `openclaw doctor --fix` para `openai/*` mais o runtime Codex.

A OpenAI oferece suporte explícito ao uso de OAuth de assinatura em ferramentas e fluxos de trabalho externos como o OpenClaw.

Provedor, modelo, runtime e canal são camadas separadas. Se esses rótulos estiverem se misturando, leia [Runtimes de agente](/pt-BR/concepts/agent-runtimes) antes de alterar a configuração.

## Escolha rápida

| Objetivo                                             | Use                                                      | Observações                                                           |
| ---------------------------------------------------- | -------------------------------------------------------- | --------------------------------------------------------------------- |
| Assinatura ChatGPT/Codex com runtime Codex nativo    | `openai/gpt-5.5`                                         | Configuração padrão de agente OpenAI. Entre com autenticação Codex.   |
| Preview limitado do GPT-5.6                         | `openai/gpt-5.6-sol`, `-terra` ou `-luna`                | Requer uma organização de API aprovada pela OpenAI ou um workspace Codex. |
| Cobrança direta por chave de API para modelos de agente | `openai/gpt-5.5` mais um perfil de chave de API compatível com Codex | Use `auth.order.openai` para colocar o backup depois da autenticação por assinatura. |
| Cobrança direta por chave de API por meio do OpenClaw explícito | `openai/gpt-5.5` mais runtime de provedor/modelo `openclaw` | Selecione um perfil normal de chave de API `openai`.                  |
| Alias mais recente da API ChatGPT Instant            | `openai/chat-latest`                                     | Somente chave de API direta. Alias móvel para experimentos, não o padrão. |
| Autenticação de assinatura ChatGPT/Codex por meio do OpenClaw | `openai/gpt-5.5` mais runtime de provedor/modelo `openclaw` | Selecione um perfil OAuth `openai` para a rota de compatibilidade.    |
| Geração ou edição de imagens                         | `openai/gpt-image-2`                                     | Funciona com `OPENAI_API_KEY` ou OAuth OpenAI Codex.                  |
| Imagens com fundo transparente                       | `openai/gpt-image-1.5`                                   | Use `outputFormat=png` ou `webp` e `openai.background=transparent`.   |

## Mapa de nomes

Os nomes são parecidos, mas não são intercambiáveis:

| Nome que você vê                         | Camada            | Significado                                                                                      |
| ---------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------ |
| `openai`                                 | Prefixo de provedor | Rota canônica de modelos OpenAI; turnos de agente usam o runtime Codex.                         |
| prefixo legado OpenAI Codex              | Prefixo legado    | Namespace mais antigo de modelo/perfil. `openclaw doctor --fix` o migra para `openai`.           |
| Plugin `codex`                           | Plugin            | Plugin incluído no OpenClaw que fornece o runtime nativo do servidor de aplicativo Codex e controles de chat `/codex`. |
| provedor/modelo `agentRuntime.id: codex` | Runtime de agente | Força o harness nativo do servidor de aplicativo Codex para turnos embutidos correspondentes.    |
| `/codex ...`                             | Conjunto de comandos de chat | Vincula/controla threads do servidor de aplicativo Codex a partir de uma conversa.              |
| `runtime: "acp", agentId: "codex"`       | Rota de sessão ACP | Caminho de fallback explícito que executa o Codex por meio de ACP/acpx.                         |

Isso significa que uma configuração pode conter intencionalmente refs de modelo `openai/*` enquanto os perfis de autenticação apontam para credenciais de chave de API ou OAuth ChatGPT/Codex. Use `auth.order.openai` para configuração; `openclaw doctor --fix` reescreve refs de modelo Codex legadas, ids de perfil de autenticação Codex legados e ordem de autenticação Codex legada para a rota canônica da OpenAI.

<Note>
O GPT-5.5 está disponível tanto por acesso direto com chave de API da OpenAI Platform quanto por rotas de assinatura/OAuth. Para assinatura ChatGPT/Codex mais execução nativa do Codex, use `openai/gpt-5.5`; configuração de runtime não definida agora seleciona o harness Codex para turnos de agente OpenAI. Use perfis de chave de API da OpenAI somente quando quiser autenticação direta por chave de API para um modelo de agente OpenAI.
</Note>

## Preview limitado do GPT-5.6

O OpenClaw reconhece os três ids públicos de modelo GPT-5.6:

- `openai/gpt-5.6-sol`
- `openai/gpt-5.6-terra`
- `openai/gpt-5.6-luna`

Todos os três expõem raciocínio `max` no catálogo atual do servidor de aplicativo Codex. O anúncio de lançamento da OpenAI descreve Sol como o nível flagship, Terra como o nível balanceado e Luna como o nível rápido e de menor custo. Consulte o [anúncio de lançamento do GPT-5.6](https://openai.com/index/previewing-gpt-5-6-sol/) e o [guia de acesso ao preview](https://help.openai.com/en/articles/20001325-a-preview-of-gpt-5-6-sol-terra-and-luna).

O acesso é por allowlist durante o preview e pode ser concedido separadamente para a API e o Codex. Um plano pago do ChatGPT sozinho não concede acesso. O OpenClaw mantém `openai/gpt-5.5` como padrão; selecionar uma ref GPT-5.6 sem acesso retorna o erro de acesso upstream em vez de fazer fallback silenciosamente.

<Note>
Turnos de modelo de agente OpenAI exigem o Plugin de servidor de aplicativo Codex incluído. A configuração explícita de runtime do OpenClaw continua disponível como uma rota de compatibilidade opcional. Quando o OpenClaw é selecionado explicitamente com um perfil OAuth `openai`, o OpenClaw mantém a ref pública de modelo como `openai/*` e roteia internamente pelo transporte autenticado por Codex. Execute `openclaw doctor --fix` para reparar refs de modelo Codex legadas obsoletas, `codex-cli/*` ou pins antigos de sessão de runtime que não vêm de configuração explícita de runtime.
</Note>

## Cobertura de recursos do OpenClaw

| Capacidade OpenAI        | Superfície do OpenClaw                                                                        | Status                                                                 |
| ------------------------ | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Chat / Responses         | provedor de modelo `openai/<model>`                                                           | Sim                                                                    |
| Modelos de assinatura Codex | `openai/<model>` com OAuth OpenAI                                                          | Sim                                                                    |
| Refs de modelo Codex legadas | refs de modelo Codex legadas ou `codex-cli/<model>`                                      | Reparadas pelo doctor para `openai/<model>`                            |
| Harness de servidor de aplicativo Codex | `openai/<model>` com runtime omitido ou provedor/modelo `agentRuntime.id: codex` | Sim                                                                    |
| Busca web no servidor    | Ferramenta nativa OpenAI Responses                                                            | Sim, quando a busca web está habilitada e nenhum provedor está fixado  |
| Imagens                  | `image_generate`                                                                              | Sim                                                                    |
| Vídeos                   | `video_generate`                                                                              | Sim                                                                    |
| Texto para fala          | `messages.tts.provider: "openai"` / `tts`                                                     | Sim                                                                    |
| Fala para texto em lote  | `tools.media.audio` / compreensão de mídia                                                     | Sim                                                                    |
| Fala para texto por streaming | Voice Call `streaming.provider: "openai"`                                                | Sim                                                                    |
| Voz realtime             | Voice Call `realtime.provider: "openai"` / Control UI Talk `talk.realtime.provider: "openai"` | Sim (requer créditos da OpenAI Platform, não assinatura Codex/ChatGPT) |
| Embeddings               | provedor de embeddings de memória                                                             | Sim                                                                    |

<Note>
  A voz OpenAI Realtime (usada pelo `realtime.provider: "openai"` do Voice Call e pelo Control UI Talk com `talk.realtime.provider: "openai"`) passa pela **API Realtime da OpenAI Platform** pública, que é cobrada contra créditos da OpenAI Platform, e não contra a cota de assinatura Codex/ChatGPT. Uma conta com OAuth OpenAI saudável que executa modelos de chat baseados em Codex sem problemas ainda precisa de um perfil de autenticação por chave de API da OpenAI ou de uma chave de API da Platform com cobrança financiada da Platform para voz realtime.

Correção: adicione créditos da Platform em
[platform.openai.com/account/billing](https://platform.openai.com/account/billing)
para a organização que sustenta suas credenciais realtime. A voz realtime aceita o perfil de autenticação por chave de API `openai` criado por `openclaw onboard --auth-choice openai-api-key`, uma `OPENAI_API_KEY` da Platform configurada via `talk.realtime.providers.openai.apiKey` para Control UI Talk, `plugins.entries.voice-call.config.realtime.providers.openai.apiKey` para Voice Call ou a variável de ambiente `OPENAI_API_KEY`. Perfis OAuth OpenAI ainda podem executar modelos de chat `openai/*` baseados em Codex na mesma instalação do OpenClaw, mas eles não configuram voz realtime.
</Note>

## Embeddings de memória

O OpenClaw pode usar a OpenAI, ou um endpoint de embeddings compatível com OpenAI, para indexação de `memory_search` e embeddings de consulta:

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai",
        model: "text-embedding-3-small",
      },
    },
  },
}
```

Para endpoints compatíveis com OpenAI que exigem rótulos de embedding assimétricos, defina `queryInputType` e `documentInputType` em `memorySearch`. O OpenClaw os encaminha como campos de solicitação `input_type` específicos do provedor: embeddings de consulta usam `queryInputType`; blocos de memória indexados e indexação em lote usam `documentInputType`. Consulte a [referência de configuração de memória](/pt-BR/reference/memory-config#provider-specific-config) para o exemplo completo.

## Introdução

Escolha seu método de autenticação preferido e siga as etapas de configuração.

<Tabs>
  <Tab title="API key (OpenAI Platform)">
    **Melhor para:** acesso direto à API e cobrança baseada em uso.

    <Steps>
      <Step title="Get your API key">
        Crie ou copie uma chave de API do [dashboard da OpenAI Platform](https://platform.openai.com/api-keys).
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        Ou passe a chave diretamente:

        ```bash
        openclaw onboard --openai-api-key "$OPENAI_API_KEY"
        ```
      </Step>
      <Step title="Verifique se o modelo está disponível">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### Resumo de rota

    | Ref. do modelo              | Configuração de runtime             | Rota                       | Autenticação             |
    | ---------------------- | -------------------------- | --------------------------- | ---------------- |
    | `openai/gpt-5.5`      | omitido / provider/model `agentRuntime.id: "codex"` | harness Codex app-server | perfil OpenAI compatível com Codex |
    | `openai/gpt-5.4-mini` | omitido / provider/model `agentRuntime.id: "codex"` | harness Codex app-server | perfil OpenAI compatível com Codex |
    | `openai/gpt-5.5`      | provider/model `agentRuntime.id: "openclaw"`              | runtime incorporado do OpenClaw      | perfil `openai` selecionado |

    <Note>
    Modelos de agente `openai/*` usam o harness Codex app-server. Para usar
    autenticação por chave de API para um modelo de agente, crie um perfil de chave de API compatível com Codex e ordene-o
    com `auth.order.openai`; `OPENAI_API_KEY` continua sendo o fallback direto para
    superfícies de API OpenAI que não são de agente. Execute `openclaw doctor --fix` para migrar entradas antigas
    de ordem de autenticação Codex legadas.
    </Note>

    ### Exemplo de configuração

    ```json5
    {
      env: { OPENAI_API_KEY: "example-openai-key-not-real" },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    Para testar o modelo Instant atual do ChatGPT pela API da OpenAI, defina o modelo
    como `openai/chat-latest`:

    ```json5
    {
      env: { OPENAI_API_KEY: "example-openai-key-not-real" },
      agents: { defaults: { model: { primary: "openai/chat-latest" } } },
    }
    ```

    `chat-latest` é um alias móvel. A OpenAI o documenta como o modelo Instant mais recente
    usado no ChatGPT e recomenda `gpt-5.5` para uso da API em produção, portanto
    mantenha `openai/gpt-5.5` como o padrão estável, a menos que você queira explicitamente esse
    comportamento de alias. Atualmente, o alias aceita apenas verbosidade de texto `medium`, então
    o OpenClaw normaliza substituições incompatíveis de verbosidade de texto da OpenAI para este
    modelo.

    <Warning>
    O OpenClaw **não** expõe `gpt-5.3-codex-spark` na rota direta de chave de API da OpenAI. Ele está disponível apenas por meio de entradas do catálogo de assinatura Codex quando sua conta conectada o expõe.
    </Warning>

  </Tab>

  <Tab title="Assinatura Codex">
    **Melhor para:** usar sua assinatura ChatGPT/Codex com execução nativa do Codex app-server em vez de uma chave de API separada. A nuvem Codex requer login no ChatGPT.

    <Steps>
      <Step title="Execute o OAuth do Codex">
        ```bash
        openclaw onboard --auth-choice openai
        ```

        Ou execute o OAuth diretamente:

        ```bash
        openclaw models auth login --provider openai
        ```

        Para configurações headless ou hostis a callback, adicione `--device-code` para entrar com um fluxo de código de dispositivo do ChatGPT em vez do callback de navegador localhost:

        ```bash
        openclaw models auth login --provider openai --device-code
        ```
      </Step>
      <Step title="Use a rota canônica do modelo OpenAI">
        ```bash
        openclaw config set agents.defaults.model.primary openai/gpt-5.5
        ```

        Nenhuma configuração de runtime é necessária para o caminho padrão. Turnos de agente da OpenAI
        selecionam o runtime nativo Codex app-server automaticamente, e o OpenClaw
        instala ou repara o Plugin Codex empacotado quando esta rota é escolhida.
      </Step>
      <Step title="Verifique se a autenticação Codex está disponível">
        ```bash
        openclaw models list --provider openai
        ```

        Depois que o Gateway estiver em execução, envie `/codex status` ou `/codex models`
        no chat para verificar o runtime nativo app-server.
      </Step>
    </Steps>

    ### Resumo de rota

    | Ref. do modelo | Configuração de runtime | Rota | Autenticação |
    |-----------|----------------|-------|------|
    | `openai/gpt-5.5` | omitido / provider/model `agentRuntime.id: "codex"` | harness nativo Codex app-server | login Codex ou perfil de autenticação `openai` ordenado |
    | `openai/gpt-5.5` | provider/model `agentRuntime.id: "openclaw"` | runtime incorporado do OpenClaw com transporte interno de autenticação Codex | perfil OAuth `openai` selecionado |
    | ref. GPT-5.5 Codex legada | reparada pelo doctor | rota legada reescrita para `openai/gpt-5.5` | perfil OAuth OpenAI migrado |
    | `codex-cli/gpt-5.5` | reparada pelo doctor | rota CLI legada reescrita para `openai/gpt-5.5` | autenticação Codex app-server |

    <Warning>
    Prefira `openai/gpt-5.5` para novas configurações de agente baseadas em assinatura. Refs GPT Codex
    legadas mais antigas são rotas legadas do OpenClaw, não o caminho de runtime nativo Codex;
    execute `openclaw doctor --fix` quando quiser migrá-las para refs
    `openai/*` canônicas. `gpt-5.3-codex-spark` continua limitado a contas cujo
    catálogo de assinatura Codex anuncia esse modelo; refs diretas de chave de API da OpenAI e
    do Azure para ele continuam suprimidas.
    </Warning>

    <Note>
    O prefixo de modelo Codex legado é uma configuração legada reparada pelo doctor. Para
    a configuração comum de assinatura mais runtime nativo, entre com autenticação Codex,
    mas mantenha a ref. do modelo como `openai/gpt-5.5`. Novas configurações devem colocar a
    ordem de autenticação de agente OpenAI em `auth.order.openai`; o doctor migra entradas antigas
    de ordem de autenticação Codex legadas.
    </Note>

    ### Exemplo de configuração

    ```json5
    {
      plugins: { entries: { codex: { enabled: true } } },
      agents: {
        defaults: {
          model: { primary: "openai/gpt-5.5" },
        },
      },
    }
    ```

    Com um backup por chave de API, mantenha o modelo em `openai/gpt-5.5` e coloque a
    ordem de autenticação em `openai`. O OpenClaw tentará a assinatura primeiro, depois
    a chave de API, permanecendo no harness Codex:

    ```json5
    {
      plugins: { entries: { codex: { enabled: true } } },
      agents: {
        defaults: {
          model: { primary: "openai/gpt-5.5" },
        },
      },
      auth: {
        order: {
          openai: [
            "openai:user@example.com",
            "openai:api-key-backup",
          ],
        },
      },
    }
    ```

    <Note>
    O onboarding não importa mais material OAuth de `~/.codex`. Entre com OAuth no navegador (padrão) ou com o fluxo de código de dispositivo acima — o OpenClaw gerencia as credenciais resultantes em seu próprio armazenamento de autenticação de agente.
    </Note>

    ### Verificar e recuperar roteamento OAuth Codex

    Use estes comandos para ver qual modelo, runtime e rota de autenticação seu agente padrão
    está usando:

    ```bash
    openclaw models status
    openclaw models auth list --provider openai
    openclaw config get agents.defaults.model --json
    openclaw config get models.providers.openai.agentRuntime --json
    ```

    Para um agente específico, adicione `--agent <id>`:

    ```bash
    openclaw models status --agent <id>
    openclaw models auth list --agent <id> --provider openai
    ```

    Se uma configuração mais antiga ainda tiver referências legadas a GPT do Codex ou uma fixação obsoleta de sessão do runtime OpenAI
    sem configuração explícita de runtime, repare-a:

    ```bash
    openclaw doctor --fix
    openclaw config validate
    ```

    Se `models auth list --provider openai` não mostrar nenhum perfil utilizável, faça
    login novamente:

    ```bash
    openclaw models auth login --provider openai
    openclaw models status --probe --probe-provider openai
    ```

    Use `--profile-id` quando quiser vários logins OAuth do Codex no mesmo
    agente e depois quiser controlá-los pela ordenação de autenticação ou por `/model ...@<profileId>`:

    ```bash
    openclaw models auth login --provider openai --profile-id openai:ritsuko
    openclaw models auth login --provider openai --profile-id openai:lain
    ```

    `openai/*` é a rota de modelo para turnos de agente OpenAI pelo Codex. Execute
    `openclaw doctor --fix` para migrar ids de perfil com prefixo legado OpenAI Codex e
    entradas de ordenação antes de depender da ordenação de perfis.

    ### Indicador de status

    O chat `/status` mostra qual runtime de modelo está ativo na sessão atual.
    O harness app-server Codex incluído aparece como `Runtime: OpenAI Codex` para
    turnos de modelo de agente OpenAI. Fixações obsoletas de sessão do runtime OpenAI são reparadas para Codex, a menos que
    a configuração fixe explicitamente OpenClaw.

    ### Aviso do Doctor

    Se referências legadas a modelos Codex ou fixações obsoletas do runtime OpenAI permanecerem na configuração ou
    no estado da sessão, `openclaw doctor --fix` as reescreve para `openai/*` com o
    runtime Codex, a menos que OpenClaw esteja configurado explicitamente.

    ### Limite da janela de contexto

    OpenClaw trata os metadados do modelo e o limite de contexto do runtime como valores separados.

    Para `openai/gpt-5.5` pelo catálogo OAuth do Codex:

    - `contextWindow` nativo: `1000000`
    - Limite padrão de `contextTokens` do runtime: `272000`

    O limite padrão menor tem melhores características de latência e qualidade na prática. Substitua-o com `contextTokens`:

    ```json5
    {
      models: {
        providers: {
          openai: {
            models: [{ id: "gpt-5.5", contextTokens: 160000 }],
          },
        },
      },
    }
    ```

    <Note>
    Use `contextWindow` para declarar metadados nativos do modelo. Use `contextTokens` para limitar o orçamento de contexto do runtime.
    </Note>

    ### Recuperação do catálogo

    OpenClaw usa metadados do catálogo upstream do Codex para `gpt-5.5` quando eles estão
    presentes. Se a descoberta ao vivo do Codex omitir a linha `gpt-5.5` enquanto
    a conta estiver autenticada, OpenClaw sintetiza essa linha de modelo OAuth para que
    execuções de Cron, subagente e modelo padrão configurado não falhem com
    `Unknown model`.

  </Tab>
</Tabs>

## Autenticação nativa do app-server Codex

O harness app-server Codex nativo usa referências de modelo `openai/*` mais configuração
de runtime omitida ou `agentRuntime.id: "codex"` de provedor/modelo, mas sua autenticação
ainda é baseada em conta. OpenClaw seleciona a autenticação nesta ordem:

1. Perfis ordenados de autenticação OpenAI para o agente, preferencialmente em
   `auth.order.openai`. Execute `openclaw doctor --fix` para migrar ids de perfil de autenticação
   Codex legados mais antigos e a ordem legada de autenticação Codex.
2. A conta existente do app-server, como um login local ChatGPT do CLI Codex.
3. Somente para inicializações locais do app-server por stdio, `CODEX_API_KEY`, depois
   `OPENAI_API_KEY`, quando o app-server não relata nenhuma conta e ainda exige
   autenticação OpenAI.

Isso significa que um login local de assinatura ChatGPT/Codex não é substituído apenas
porque o processo do Gateway também tem `OPENAI_API_KEY` para modelos OpenAI diretos
ou embeddings. O fallback de chave de API por env é apenas o caminho local stdio sem conta; ele
não é enviado para conexões WebSocket do app-server. Quando um perfil Codex
no estilo assinatura é selecionado, OpenClaw também mantém `CODEX_API_KEY` e `OPENAI_API_KEY`
fora do filho app-server stdio iniciado e envia as credenciais selecionadas
pela RPC de login do app-server. Quando esse perfil de assinatura é bloqueado por um
limite de uso do Codex, OpenClaw pode alternar para o próximo perfil de chave de API
`openai:*` ordenado sem alterar o modelo selecionado nem sair do harness
Codex. Depois que o horário de redefinição da assinatura passa, o perfil de assinatura fica
elegível novamente.

## Geração de imagens

O Plugin `openai` incluído registra a geração de imagens pela ferramenta `image_generate`.
Ele oferece suporte tanto à geração de imagens com chave de API OpenAI quanto à geração de imagens
com OAuth do Codex pela mesma referência de modelo `openai/gpt-image-2`.

| Capacidade                | Chave de API da OpenAI             | OAuth do Codex                       |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| Ref. do modelo            | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| Autenticação              | `OPENAI_API_KEY`                   | Login OAuth do OpenAI Codex          |
| Transporte                | API de Imagens da OpenAI           | Backend Responses do Codex           |
| Máx. de imagens por solicitação | 4                            | 4                                    |
| Modo de edição            | Habilitado (até 5 imagens de referência) | Habilitado (até 5 imagens de referência) |
| Substituições de tamanho  | Compatíveis, incluindo tamanhos 2K/4K | Compatíveis, incluindo tamanhos 2K/4K |
| Proporção / resolução     | Não encaminhado para a API de Imagens da OpenAI | Mapeado para um tamanho compatível quando seguro |

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "openai/gpt-image-2" },
    },
  },
}
```

<Note>
Consulte [Geração de imagens](/pt-BR/tools/image-generation) para parâmetros compartilhados da ferramenta, seleção de provedor e comportamento de failover.
</Note>

`gpt-image-2` é o padrão tanto para geração de texto para imagem da OpenAI quanto para
edição de imagens. `gpt-image-1.5`, `gpt-image-1` e `gpt-image-1-mini` continuam utilizáveis como
substituições explícitas de modelo. Use `openai/gpt-image-1.5` para saída
PNG/WebP com fundo transparente; a API atual `gpt-image-2` rejeita
`background: "transparent"`.

Para uma solicitação com fundo transparente, agentes devem chamar `image_generate` com
`model: "openai/gpt-image-1.5"`, `outputFormat: "png"` ou `"webp"` e
`background: "transparent"`; a opção de provedor `openai.background` mais antiga
ainda é aceita. O OpenClaw também protege as rotas públicas da OpenAI e
do OAuth do OpenAI Codex reescrevendo solicitações transparentes padrão de
`openai/gpt-image-2` para `gpt-image-1.5`; endpoints Azure e personalizados compatíveis com OpenAI mantêm
seus nomes configurados de implantação/modelo.

A mesma configuração é exposta para execuções CLI sem interface:

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

Use as mesmas flags `--output-format` e `--background` com
`openclaw infer image edit` ao partir de um arquivo de entrada.
`--openai-background` continua disponível como um alias específico da OpenAI.
Use `--quality low|medium|high|auto` quando precisar controlar a qualidade e o custo
do OpenAI Images. Use `--openai-moderation low|auto` para passar a dica de
moderação específica do provedor da OpenAI a partir de `image generate` ou `image edit`.

Para instalações OAuth do ChatGPT/Codex, mantenha a mesma ref. `openai/gpt-image-2`. Quando um
perfil OAuth `openai` está configurado, o OpenClaw resolve esse token de acesso OAuth
armazenado e envia solicitações de imagem pelo backend Responses do Codex. Ele
não tenta primeiro `OPENAI_API_KEY` nem recorre silenciosamente a uma chave de API para essa
solicitação. Configure `models.providers.openai` explicitamente com uma chave de API,
URL base personalizada ou endpoint Azure quando quiser a rota direta da API de Imagens da OpenAI.
Se esse endpoint de imagem personalizado estiver em uma LAN/endereço privado confiável, também defina
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; o OpenClaw mantém
endpoints de imagem privados/internos compatíveis com OpenAI bloqueados a menos que essa adesão explícita
esteja presente.

Gerar:

```
/tool image_generate model=openai/gpt-image-2 prompt="A polished launch poster for OpenClaw on macOS" size=3840x2160 count=1
```

Gerar um PNG transparente:

```
/tool image_generate model=openai/gpt-image-1.5 prompt="A simple red circle sticker on a transparent background" outputFormat=png background=transparent
```

Editar:

```
/tool image_generate model=openai/gpt-image-2 prompt="Preserve the object shape, change the material to translucent glass" image=/path/to/reference.png size=1024x1536
```

## Geração de vídeo

O Plugin `openai` integrado registra geração de vídeo por meio da ferramenta `video_generate`.

| Capacidade       | Valor                                                                             |
| ---------------- | --------------------------------------------------------------------------------- |
| Modelo padrão    | `openai/sora-2`                                                                   |
| Modos            | Texto para vídeo, imagem para vídeo, edição de vídeo único                        |
| Entradas de referência | 1 imagem ou 1 vídeo                                                         |
| Substituições de tamanho | Compatíveis para texto para vídeo e imagem para vídeo                    |
| Outras substituições | `aspectRatio`, `resolution`, `audio`, `watermark` são ignorados com um aviso da ferramenta |

Solicitações de imagem para vídeo da OpenAI usam `POST /v1/videos` com uma imagem
`input_reference`. Edições de vídeo único usam `POST /v1/videos/edits` com o
vídeo enviado no campo `video`.

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "openai/sora-2" },
    },
  },
}
```

<Note>
Consulte [Geração de vídeo](/pt-BR/tools/video-generation) para parâmetros compartilhados da ferramenta, seleção de provedor e comportamento de failover.
</Note>

## Contribuição de prompt GPT-5

O OpenClaw adiciona uma contribuição compartilhada de prompt GPT-5 para execuções da família GPT-5 em superfícies de prompt montadas pelo OpenClaw. Ela se aplica por id de modelo, então rotas OpenClaw/provedor como refs legadas pré-reparo (ref legada GPT-5.5 do Codex), `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` e outras refs GPT-5 compatíveis recebem a mesma sobreposição. Modelos GPT-4.x mais antigos não recebem.

O harness Codex nativo integrado não recebe essa sobreposição GPT-5 do OpenClaw por meio das instruções de desenvolvedor do servidor de app do Codex. O Codex nativo mantém o comportamento de base, modelo e documentos de projeto pertencente ao Codex, enquanto o OpenClaw desabilita a personalidade integrada do Codex para threads nativas para que os arquivos de personalidade do workspace do agente permaneçam autoritativos. O OpenClaw contribui apenas contexto de runtime, como entrega por canal, ferramentas dinâmicas do OpenClaw, delegação ACP, contexto do workspace e Skills do OpenClaw.

A contribuição GPT-5 adiciona um contrato de comportamento marcado para persistência de persona, segurança de execução, disciplina de ferramentas, formato de saída, verificações de conclusão e verificação em prompts montados pelo OpenClaw correspondentes. O comportamento de resposta específico do canal e de mensagem silenciosa permanece no prompt de sistema compartilhado do OpenClaw e na política de entrega de saída. A camada de estilo de interação amigável é separada e configurável.

| Valor                  | Efeito                                      |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (padrão)  | Habilita a camada de estilo de interação amigável |
| `"on"`                 | Alias para `"friendly"`                     |
| `"off"`                | Desabilita apenas a camada de estilo amigável |

<Tabs>
  <Tab title="Configuração">
    ```json5
    {
      agents: {
        defaults: {
          promptOverlays: {
            gpt5: { personality: "friendly" },
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="CLI">
    ```bash
    openclaw config set agents.defaults.promptOverlays.gpt5.personality off
    ```
  </Tab>
</Tabs>

<Tip>
Os valores não diferenciam maiúsculas de minúsculas em runtime, então `"Off"` e `"off"` desabilitam a camada de estilo amigável.
</Tip>

<Note>
O `plugins.entries.openai.config.personality` legado ainda é lido como fallback de compatibilidade quando a configuração compartilhada `agents.defaults.promptOverlays.gpt5.personality` não está definida.
</Note>

## Voz e fala

<AccordionGroup>
  <Accordion title="Síntese de fala (TTS)">
    O Plugin `openai` integrado registra síntese de fala para a superfície `messages.tts`.

    | Configuração | Caminho de configuração | Padrão |
    |---------|------------|---------|
    | Modelo | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Voz | `messages.tts.providers.openai.speakerVoice` | `coral` |
    | Velocidade | `messages.tts.providers.openai.speed` | (não definido) |
    | Instruções | `messages.tts.providers.openai.instructions` | (não definido, somente `gpt-4o-mini-tts`) |
    | Formato | `messages.tts.providers.openai.responseFormat` | `opus` para notas de voz, `mp3` para arquivos |
    | Chave de API | `messages.tts.providers.openai.apiKey` | Usa fallback para `OPENAI_API_KEY` |
    | URL base | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |
    | Corpo extra | `messages.tts.providers.openai.extraBody` / `extra_body` | (não definido) |

    Modelos disponíveis: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`. Vozes disponíveis: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`.

    `extraBody` é mesclado ao JSON da solicitação `/audio/speech` após os campos gerados pelo OpenClaw, então use-o para endpoints compatíveis com OpenAI que exigem chaves adicionais, como `lang`. Chaves de protótipo são ignoradas.

    ```json5
    {
      messages: {
        tts: {
          providers: {
            openai: { model: "gpt-4o-mini-tts", speakerVoice: "coral" },
          },
        },
      },
    }
    ```

    <Note>
    Defina `OPENAI_TTS_BASE_URL` para substituir a URL base de TTS sem afetar o endpoint da API de chat. TTS da OpenAI e voz Realtime são ambos configurados por meio de uma chave de API da OpenAI Platform; instalações somente OAuth ainda podem usar modelos de chat apoiados pelo Codex, mas não retorno de fala ao vivo da OpenAI.
    </Note>

  </Accordion>

  <Accordion title="Fala para texto">
    O Plugin `openai` integrado registra fala para texto em lote por meio da
    superfície de transcrição de compreensão de mídia do OpenClaw.

    - Modelo padrão: `gpt-4o-transcribe`
    - Endpoint: REST da OpenAI `/v1/audio/transcriptions`
    - Caminho de entrada: upload de arquivo de áudio multipart
    - Compatível com o OpenClaw onde quer que a transcrição de áudio de entrada use
      `tools.media.audio`, incluindo segmentos de canal de voz do Discord e anexos de áudio
      de canal

    Para forçar a OpenAI na transcrição de áudio de entrada:

    ```json5
    {
      tools: {
        media: {
          audio: {
            models: [
              {
                type: "provider",
                provider: "openai",
                model: "gpt-4o-transcribe",
              },
            ],
          },
        },
      },
    }
    ```

    Dicas de idioma e prompt são encaminhadas para a OpenAI quando fornecidas pela
    configuração compartilhada de mídia de áudio ou pela solicitação de transcrição por chamada.

  </Accordion>

  <Accordion title="Transcrição em tempo real">
    O Plugin `openai` integrado registra transcrição em tempo real para o Plugin Voice Call.

    | Configuração | Caminho de configuração | Padrão |
    |---------|------------|---------|
    | Modelo | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Idioma | `...openai.language` | (não definido) |
    | Prompt | `...openai.prompt` | (não definido) |
    | Duração do silêncio | `...openai.silenceDurationMs` | `800` |
    | Limite de VAD | `...openai.vadThreshold` | `0.5` |
    | Autenticação | `...openai.apiKey`, `OPENAI_API_KEY` ou OAuth `openai` | Chaves de API conectam diretamente; OAuth emite um segredo de cliente de transcrição Realtime |

    <Note>
    Usa uma conexão WebSocket para `wss://api.openai.com/v1/realtime` com áudio G.711 u-law (`g711_ulaw` / `audio/pcmu`). Quando apenas OAuth `openai` está configurado, o Gateway emite um segredo de cliente efêmero de transcrição Realtime antes de abrir o WebSocket. Este provedor de streaming é para o caminho de transcrição em tempo real do Voice Call; a voz do Discord atualmente grava segmentos curtos e usa o caminho de transcrição em lote `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Voz em tempo real">
    O Plugin `openai` integrado registra voz em tempo real para o Plugin Voice Call.

    | Configuração | Caminho de configuração | Padrão |
    |---------|------------|---------|
    | Modelo | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-2` |
    | Voz | `...openai.voice` | `alloy` |
    | Temperatura (ponte de implantação do Azure) | `...openai.temperature` | `0.8` |
    | Limite de VAD | `...openai.vadThreshold` | `0.5` |
    | Duração do silêncio | `...openai.silenceDurationMs` | `500` |
    | Preenchimento de prefixo | `...openai.prefixPaddingMs` | `300` |
    | Esforço de raciocínio | `...openai.reasoningEffort` | (não definido) |
    | Autenticação | perfil de autenticação por chave de API `openai`, `...openai.apiKey` ou `OPENAI_API_KEY` | chave de API da OpenAI Platform obrigatória; OAuth da OpenAI não configura voz Realtime |

    Vozes Realtime integradas disponíveis para `gpt-realtime-2`: `alloy`, `ash`,
    `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`, `marin`, `cedar`.
    A OpenAI recomenda `marin` e `cedar` para a melhor qualidade Realtime. Este
    é um conjunto separado das vozes de conversão de texto em fala acima; não presuma que uma voz TTS
    como `fable`, `nova` ou `onyx` seja válida para sessões Realtime.

    <Note>
    Pontes OpenAI realtime de backend usam o formato de sessão GA Realtime WebSocket, que não aceita `session.temperature`. Implantações do Azure OpenAI permanecem disponíveis via `azureEndpoint` e `azureDeployment` e mantêm o formato de sessão compatível com a implantação. Oferece suporte a chamadas de ferramenta bidirecionais e áudio G.711 u-law.
    </Note>

    <Note>
    A voz Realtime é selecionada quando a sessão é criada. A OpenAI permite que a maioria dos
    campos da sessão seja alterada posteriormente, mas a voz não pode ser alterada depois que o
    modelo tiver emitido áudio nessa sessão. Atualmente, o OpenClaw expõe os
    IDs de voz Realtime integrados como strings.
    </Note>

    <Note>
    O Talk da Control UI usa sessões realtime no navegador da OpenAI com um segredo de cliente
    efêmero cunhado pelo Gateway e uma troca SDP WebRTC direta do navegador com a
    OpenAI Realtime API. O Gateway cunha esse segredo de cliente com o perfil de autenticação
    por chave de API `openai` selecionado ou a chave de API da OpenAI Platform configurada. O relay do Gateway
    e as pontes Realtime WebSocket de backend do Voice Call usam o mesmo
    caminho de autenticação somente por chave de API para endpoints nativos da OpenAI. A verificação ao vivo
    de mantenedor está disponível com
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`;
    os trechos da OpenAI verificam tanto a ponte WebSocket de backend quanto a troca
    SDP WebRTC do navegador sem registrar segredos.
    </Note>

  </Accordion>
</AccordionGroup>

## Endpoints do Azure OpenAI

O provedor `openai` integrado pode apontar para um recurso do Azure OpenAI para geração
de imagens substituindo a URL base. No caminho de geração de imagens, o OpenClaw
detecta nomes de host do Azure em `models.providers.openai.baseUrl` e alterna para
o formato de solicitação do Azure automaticamente.

<Note>
A voz Realtime usa um caminho de configuração separado
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
e não é afetada por `models.providers.openai.baseUrl`. Consulte o acordeão **Voz
Realtime** em [Voz e fala](#voice-and-speech) para suas configurações do Azure.
</Note>

Use o Azure OpenAI quando:

- Você já tiver uma assinatura, cota ou contrato empresarial do Azure OpenAI
- Você precisar de residência regional de dados ou controles de conformidade fornecidos pelo Azure
- Você quiser manter o tráfego dentro de uma tenancy existente do Azure

### Configuração

Para geração de imagens no Azure por meio do provedor `openai` integrado, aponte
`models.providers.openai.baseUrl` para seu recurso do Azure e defina `apiKey` como
a chave do Azure OpenAI (não uma chave da OpenAI Platform):

```json5
{
  models: {
    providers: {
      openai: {
        baseUrl: "https://<your-resource>.openai.azure.com",
        apiKey: "<azure-openai-api-key>",
      },
    },
  },
}
```

O OpenClaw reconhece estes sufixos de host do Azure para a rota de geração de imagens
do Azure:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

Para solicitações de geração de imagens em um host reconhecido do Azure, o OpenClaw:

- Envia o cabeçalho `api-key` em vez de `Authorization: Bearer`
- Usa caminhos com escopo de implantação (`/openai/deployments/{deployment}/...`)
- Acrescenta `?api-version=...` a cada solicitação
- Usa um tempo limite padrão de solicitação de 600s para chamadas de geração de imagens do Azure.
  Valores `timeoutMs` por chamada ainda substituem esse padrão.

Outras URLs base (OpenAI pública, proxies compatíveis com OpenAI) mantêm o formato
padrão de solicitação de imagem da OpenAI.

<Note>
O roteamento do Azure para o caminho de geração de imagens do provedor `openai` requer
OpenClaw 2026.4.22 ou posterior. Versões anteriores tratam qualquer
`openai.baseUrl` personalizada como o endpoint público da OpenAI e falharão em implantações
de imagem do Azure.
</Note>

### Versão da API

Defina `AZURE_OPENAI_API_VERSION` para fixar uma versão preview ou GA específica do Azure
para o caminho de geração de imagens do Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

O padrão é `2024-12-01-preview` quando a variável não está definida.

### Nomes de modelo são nomes de implantação

O Azure OpenAI vincula modelos a implantações. Para solicitações de geração de imagens do Azure
roteadas pelo provedor `openai` integrado, o campo `model` no OpenClaw
deve ser o **nome da implantação do Azure** que você configurou no portal do Azure, não
o ID público do modelo da OpenAI.

Se você criar uma implantação chamada `gpt-image-2-prod` que serve `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

A mesma regra de nome de implantação se aplica a chamadas de geração de imagens roteadas pelo
provedor `openai` integrado.

### Disponibilidade regional

A geração de imagens do Azure está disponível atualmente apenas em um subconjunto de regiões
(por exemplo, `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Verifique a lista atual de regiões da Microsoft antes de criar uma
implantação e confirme se o modelo específico é oferecido na sua região.

### Diferenças de parâmetros

O Azure OpenAI e a OpenAI pública nem sempre aceitam os mesmos parâmetros de imagem.
O Azure pode rejeitar opções que a OpenAI pública permite (por exemplo, certos
valores de `background` em `gpt-image-2`) ou expô-las apenas em versões específicas
do modelo. Essas diferenças vêm do Azure e do modelo subjacente, não do
OpenClaw. Se uma solicitação do Azure falhar com um erro de validação, verifique o
conjunto de parâmetros compatível com sua implantação e versão de API específicas no
portal do Azure.

<Note>
O Azure OpenAI usa transporte nativo e comportamento de compatibilidade, mas não recebe
os cabeçalhos de atribuição ocultos do OpenClaw — consulte o acordeão **Rotas nativas vs compatíveis com OpenAI**
em [Configuração avançada](#advanced-configuration).

Para tráfego de chat ou Responses no Azure (além de geração de imagens), use o
fluxo de integração ou uma configuração dedicada de provedor Azure — `openai.baseUrl` sozinho
não captura o formato de API/autenticação do Azure. Existe um provedor
`azure-openai-responses/*` separado; consulte
o acordeão de Compaction do lado do servidor abaixo.
</Note>

## Configuração avançada

<AccordionGroup>
  <Accordion title="Transporte (WebSocket vs SSE)">
    O OpenClaw usa WebSocket primeiro com fallback para SSE (`"auto"`) para `openai/*`.

    No modo `"auto"`, o OpenClaw:
    - Tenta novamente uma falha inicial de WebSocket antes de fazer fallback para SSE
    - Após uma falha, marca o WebSocket como degradado por ~60 segundos e usa SSE durante o período de espera
    - Anexa cabeçalhos estáveis de identidade de sessão e turno para novas tentativas e reconexões
    - Normaliza contadores de uso (`input_tokens` / `prompt_tokens`) entre variantes de transporte

    | Valor | Comportamento |
    |-------|----------|
    | `"auto"` (padrão) | WebSocket primeiro, fallback para SSE |
    | `"sse"` | Forçar somente SSE |
    | `"websocket"` | Forçar somente WebSocket |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: { transport: "auto" },
            },
          },
        },
      },
    }
    ```

    Documentação relacionada da OpenAI:
    - [Realtime API com WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Respostas da API em streaming (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="Modo rápido">
    O OpenClaw expõe uma alternância compartilhada de modo rápido para `openai/*`:

    - **Chat/UI:** `/fast status|auto|on|off`
    - **Configuração:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Quando habilitado, o OpenClaw mapeia o modo rápido para o processamento prioritário da OpenAI (`service_tier = "priority"`). Valores existentes de `service_tier` são preservados, e o modo rápido não reescreve `reasoning` ou `text.verbosity`. `fastMode: "auto"` inicia novas chamadas de modelo em modo rápido até o corte automático e, depois, inicia chamadas posteriores de nova tentativa, fallback, resultado de ferramenta ou continuação sem modo rápido. O corte padrão é 60 segundos; defina `params.fastAutoOnSeconds` no modelo ativo para alterá-lo.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": { params: { fastMode: "auto", fastAutoOnSeconds: 30 } },
          },
        },
      },
    }
    ```

    <Note>
    Substituições de sessão prevalecem sobre a configuração. Limpar a substituição de sessão na UI de Sessões retorna a sessão ao padrão configurado.
    </Note>

  </Accordion>

  <Accordion title="Processamento prioritário (service_tier)">
    A API da OpenAI expõe processamento prioritário via `service_tier`. Defina por modelo no OpenClaw:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": { params: { serviceTier: "priority" } },
          },
        },
      },
    }
    ```

    Valores compatíveis: `auto`, `default`, `flex`, `priority`.

    <Warning>
    `serviceTier` só é encaminhado para endpoints nativos da OpenAI (`api.openai.com`) e endpoints nativos do Codex (`chatgpt.com/backend-api`). Se você rotear qualquer um dos provedores por um proxy, o OpenClaw deixa `service_tier` intacto.
    </Warning>

  </Accordion>

  <Accordion title="Compaction do lado do servidor (Responses API)">
    Para modelos OpenAI Responses diretos (`openai/*` em `api.openai.com`), o wrapper de stream OpenClaw do Plugin OpenAI habilita automaticamente a Compaction do lado do servidor:

    - Força `store: true` (a menos que a compatibilidade do modelo defina `supportsStore: false`)
    - Injeta `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - `compact_threshold` padrão: 70% de `contextWindow` (ou `80000` quando indisponível)

    Isso se aplica ao caminho de runtime integrado do OpenClaw e aos hooks do provedor OpenAI usados por execuções incorporadas. O harness do app-server nativo do Codex gerencia seu próprio contexto por meio do Codex e é configurado pela rota padrão de agente da OpenAI ou pela política de runtime de provedor/modelo.

    <Tabs>
      <Tab title="Habilitar explicitamente">
        Útil para endpoints compatíveis, como Azure OpenAI Responses:

        ```json5
        {
          agents: {
            defaults: {
              models: {
                "azure-openai-responses/gpt-5.5": {
                  params: { responsesServerCompaction: true },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="Limite personalizado">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.5": {
                  params: {
                    responsesServerCompaction: true,
                    responsesCompactThreshold: 120000,
                  },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="Desabilitar">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.5": {
                  params: { responsesServerCompaction: false },
                },
              },
            },
          },
        }
        ```
      </Tab>
    </Tabs>

    <Note>
    `responsesServerCompaction` controla apenas a injeção de `context_management`. Modelos OpenAI Responses diretos ainda forçam `store: true`, a menos que a compatibilidade defina `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="Modo GPT strict-agentic">
    Para execuções da família GPT-5 em `openai/*`, o OpenClaw pode usar um contrato de execução embarcado mais rigoroso:

    ```json5
    {
      agents: {
        defaults: {
          embeddedAgent: { executionContract: "strict-agentic" },
        },
      },
    }
    ```

    Com `strict-agentic`, o OpenClaw:
    - Ativa automaticamente `update_plan` para trabalho substancial
    - Tenta novamente turnos estruturalmente vazios ou contendo apenas raciocínio com uma continuação de resposta visível
    - Usa eventos explícitos de plano do harness quando o harness selecionado os fornece

    O OpenClaw não classifica a prosa do assistente para decidir se um turno é um plano, uma atualização de progresso ou uma resposta final.

    <Note>
    Limitado apenas a execuções da família GPT-5 da OpenAI e do Codex. Outros provedores e famílias de modelos mais antigas mantêm o comportamento padrão.
    </Note>

  </Accordion>

  <Accordion title="Rotas nativas vs. compatíveis com OpenAI">
    O OpenClaw trata endpoints diretos da OpenAI, do Codex e do Azure OpenAI de forma diferente de proxies `/v1` genéricos compatíveis com OpenAI:

    **Rotas nativas** (`openai/*`, Azure OpenAI):
    - Mantêm `reasoning: { effort: "none" }` apenas para modelos compatíveis com o esforço `none` da OpenAI
    - Omitem o raciocínio desativado para modelos ou proxies que rejeitam `reasoning.effort: "none"`
    - Definem esquemas de ferramentas como modo estrito por padrão
    - Anexam cabeçalhos ocultos de atribuição apenas em hosts nativos verificados
    - Mantêm a modelagem de solicitação exclusiva da OpenAI (`service_tier`, `store`, compatibilidade de raciocínio, dicas de cache de prompt)

    **Rotas de proxy/compatíveis:**
    - Usam comportamento de compatibilidade mais flexível
    - Removem `store` do Completions de payloads `openai-completions` não nativos
    - Aceitam JSON avançado de passagem direta `params.extra_body`/`params.extraBody` para proxies de Completions compatíveis com OpenAI
    - Aceitam `params.chat_template_kwargs` para proxies de Completions compatíveis com OpenAI, como vLLM
    - Não forçam esquemas de ferramentas estritos nem cabeçalhos exclusivos de nativos

    O Azure OpenAI usa transporte nativo e comportamento de compatibilidade, mas não recebe os cabeçalhos ocultos de atribuição.

  </Accordion>
</AccordionGroup>

## Relacionados

<CardGroup cols={2}>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de provedores, refs de modelo e comportamento de failover.
  </Card>
  <Card title="Geração de imagens" href="/pt-BR/tools/image-generation" icon="image">
    Parâmetros compartilhados da ferramenta de imagem e seleção de provedor.
  </Card>
  <Card title="Geração de vídeo" href="/pt-BR/tools/video-generation" icon="video">
    Parâmetros compartilhados da ferramenta de vídeo e seleção de provedor.
  </Card>
  <Card title="OAuth e autenticação" href="/pt-BR/gateway/authentication" icon="key">
    Detalhes de autenticação e regras de reutilização de credenciais.
  </Card>
</CardGroup>
