---
read_when:
    - Você quer executar o OpenClaw com modelos em nuvem ou locais via Ollama
    - Você precisa de orientações de setup e configuração do Ollama
summary: Execute o OpenClaw com Ollama (modelos em nuvem e locais)
title: Ollama
x-i18n:
    generated_at: "2026-04-08T02:18:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 222ec68f7d4bb29cc7796559ddef1d5059f5159e7a51e2baa3a271ddb3abb716
    source_path: providers/ollama.md
    workflow: 15
---

# Ollama

Ollama é um runtime local de LLM que facilita a execução de modelos open source na sua máquina. O OpenClaw integra com a API nativa do Ollama (`/api/chat`), oferece suporte a streaming e chamadas de ferramentas, e pode descobrir automaticamente modelos locais do Ollama quando você opta por usar `OLLAMA_API_KEY` (ou um perfil de auth) e não define uma entrada explícita `models.providers.ollama`.

<Warning>
**Usuários de Ollama remoto**: Não use a URL compatível com OpenAI `/v1` (`http://host:11434/v1`) com o OpenClaw. Isso quebra as chamadas de ferramentas e os modelos podem gerar JSON bruto de ferramentas como texto simples. Use a URL da API nativa do Ollama em vez disso: `baseUrl: "http://host:11434"` (sem `/v1`).
</Warning>

## Início rápido

### Onboarding (recomendado)

A forma mais rápida de configurar o Ollama é por meio do onboarding:

```bash
openclaw onboard
```

Selecione **Ollama** na lista de provedores. O onboarding vai:

1. Perguntar a URL base do Ollama onde sua instância pode ser acessada (padrão `http://127.0.0.1:11434`).
2. Permitir que você escolha **Cloud + Local** (modelos em nuvem e modelos locais) ou **Local** (apenas modelos locais).
3. Abrir um fluxo de login no navegador se você escolher **Cloud + Local** e não estiver autenticado em ollama.com.
4. Descobrir os modelos disponíveis e sugerir padrões.
5. Fazer `pull` automático do modelo selecionado se ele não estiver disponível localmente.

O modo não interativo também é compatível:

```bash
openclaw onboard --non-interactive \
  --auth-choice ollama \
  --accept-risk
```

Opcionalmente, especifique uma URL base ou um modelo personalizados:

```bash
openclaw onboard --non-interactive \
  --auth-choice ollama \
  --custom-base-url "http://ollama-host:11434" \
  --custom-model-id "qwen3.5:27b" \
  --accept-risk
```

### Configuração manual

1. Instale o Ollama: [https://ollama.com/download](https://ollama.com/download)

2. Faça `pull` de um modelo local se quiser inferência local:

```bash
ollama pull gemma4
# ou
ollama pull gpt-oss:20b
# ou
ollama pull llama3.3
```

3. Se também quiser modelos em nuvem, faça login:

```bash
ollama signin
```

4. Execute o onboarding e escolha `Ollama`:

```bash
openclaw onboard
```

- `Local`: apenas modelos locais
- `Cloud + Local`: modelos locais mais modelos em nuvem
- Modelos em nuvem como `kimi-k2.5:cloud`, `minimax-m2.7:cloud` e `glm-5.1:cloud` **não** exigem um `ollama pull` local

Atualmente, o OpenClaw sugere:

- padrão local: `gemma4`
- padrões em nuvem: `kimi-k2.5:cloud`, `minimax-m2.7:cloud`, `glm-5.1:cloud`

5. Se preferir a configuração manual, habilite o Ollama diretamente no OpenClaw (qualquer valor funciona; o Ollama não exige uma chave real):

```bash
# Defina a variável de ambiente
export OLLAMA_API_KEY="ollama-local"

# Ou configure no arquivo de configuração
openclaw config set models.providers.ollama.apiKey "ollama-local"
```

6. Inspecione ou troque de modelo:

```bash
openclaw models list
openclaw models set ollama/gemma4
```

7. Ou defina o padrão na configuração:

```json5
{
  agents: {
    defaults: {
      model: { primary: "ollama/gemma4" },
    },
  },
}
```

## Descoberta de modelos (provedor implícito)

Quando você define `OLLAMA_API_KEY` (ou um perfil de auth) e **não** define `models.providers.ollama`, o OpenClaw descobre modelos da instância local do Ollama em `http://127.0.0.1:11434`:

- Consulta `/api/tags`
- Usa consultas `/api/show` por melhor esforço para ler `contextWindow` quando disponível
- Marca `reasoning` com uma heurística baseada no nome do modelo (`r1`, `reasoning`, `think`)
- Define `maxTokens` com o limite padrão máximo de tokens do Ollama usado pelo OpenClaw
- Define todos os custos como `0`

Isso evita entradas manuais de modelo, mantendo o catálogo alinhado com a instância local do Ollama.

Para ver quais modelos estão disponíveis:

```bash
ollama list
openclaw models list
```

Para adicionar um novo modelo, basta fazer `pull` dele com o Ollama:

```bash
ollama pull mistral
```

O novo modelo será descoberto automaticamente e estará disponível para uso.

Se você definir `models.providers.ollama` explicitamente, a descoberta automática será ignorada e você precisará definir os modelos manualmente (veja abaixo).

## Configuração

### Configuração básica (descoberta implícita)

A forma mais simples de habilitar o Ollama é por variável de ambiente:

```bash
export OLLAMA_API_KEY="ollama-local"
```

### Configuração explícita (modelos manuais)

Use configuração explícita quando:

- O Ollama estiver sendo executado em outro host/porta.
- Você quiser forçar janelas de contexto específicas ou listas de modelos.
- Você quiser definições totalmente manuais de modelos.

```json5
{
  models: {
    providers: {
      ollama: {
        baseUrl: "http://ollama-host:11434",
        apiKey: "ollama-local",
        api: "ollama",
        models: [
          {
            id: "gpt-oss:20b",
            name: "GPT-OSS 20B",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 8192,
            maxTokens: 8192 * 10
          }
        ]
      }
    }
  }
}
```

Se `OLLAMA_API_KEY` estiver definido, você poderá omitir `apiKey` na entrada do provedor e o OpenClaw o preencherá para verificações de disponibilidade.

### URL base personalizada (configuração explícita)

Se o Ollama estiver sendo executado em outro host ou porta (a configuração explícita desativa a descoberta automática, então defina os modelos manualmente):

```json5
{
  models: {
    providers: {
      ollama: {
        apiKey: "ollama-local",
        baseUrl: "http://ollama-host:11434", // Sem /v1 - use a URL da API nativa do Ollama
        api: "ollama", // Defina explicitamente para garantir o comportamento nativo de chamada de ferramentas
      },
    },
  },
}
```

<Warning>
Não adicione `/v1` à URL. O caminho `/v1` usa o modo compatível com OpenAI, no qual a chamada de ferramentas não é confiável. Use a URL base do Ollama sem sufixo de caminho.
</Warning>

### Seleção de modelo

Depois de configurado, todos os seus modelos do Ollama ficam disponíveis:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "ollama/gpt-oss:20b",
        fallbacks: ["ollama/llama3.3", "ollama/qwen2.5-coder:32b"],
      },
    },
  },
}
```

## Modelos em nuvem

Os modelos em nuvem permitem executar modelos hospedados em nuvem (por exemplo, `kimi-k2.5:cloud`, `minimax-m2.7:cloud`, `glm-5.1:cloud`) junto com seus modelos locais.

Para usar modelos em nuvem, selecione o modo **Cloud + Local** durante a configuração. O assistente verifica se você está autenticado e abre um fluxo de login no navegador quando necessário. Se a autenticação não puder ser verificada, o assistente volta para os padrões de modelos locais.

Você também pode fazer login diretamente em [ollama.com/signin](https://ollama.com/signin).

## Ollama Web Search

O OpenClaw também oferece suporte ao **Ollama Web Search** como um provedor
empacotado de `web_search`.

- Ele usa o host do Ollama configurado (`models.providers.ollama.baseUrl` quando
  definido; caso contrário, `http://127.0.0.1:11434`).
- Ele não usa chave.
- Ele exige que o Ollama esteja em execução e autenticado com `ollama signin`.

Escolha **Ollama Web Search** durante `openclaw onboard` ou
`openclaw configure --section web`, ou defina:

```json5
{
  tools: {
    web: {
      search: {
        provider: "ollama",
      },
    },
  },
}
```

Para ver os detalhes completos de configuração e comportamento, consulte [Ollama Web Search](/pt-BR/tools/ollama-search).

## Avançado

### Modelos de raciocínio

O OpenClaw trata por padrão como compatíveis com raciocínio modelos com nomes como `deepseek-r1`, `reasoning` ou `think`:

```bash
ollama pull deepseek-r1:32b
```

### Custos do modelo

O Ollama é gratuito e é executado localmente, então todos os custos de modelo são definidos como $0.

### Configuração de streaming

A integração do OpenClaw com Ollama usa por padrão a **API nativa do Ollama** (`/api/chat`), que oferece suporte completo a streaming e chamadas de ferramentas simultaneamente. Nenhuma configuração especial é necessária.

#### Modo legado compatível com OpenAI

<Warning>
**A chamada de ferramentas não é confiável no modo compatível com OpenAI.** Use este modo apenas se você precisar do formato OpenAI para um proxy e não depender do comportamento nativo de chamada de ferramentas.
</Warning>

Se você precisar usar o endpoint compatível com OpenAI em vez disso (por exemplo, atrás de um proxy que só oferece suporte ao formato OpenAI), defina `api: "openai-completions"` explicitamente:

```json5
{
  models: {
    providers: {
      ollama: {
        baseUrl: "http://ollama-host:11434/v1",
        api: "openai-completions",
        injectNumCtxForOpenAICompat: true, // padrão: true
        apiKey: "ollama-local",
        models: [...]
      }
    }
  }
}
```

Esse modo pode não oferecer suporte a streaming + chamadas de ferramentas simultaneamente. Talvez seja necessário desativar o streaming com `params: { streaming: false }` na configuração do modelo.

Quando `api: "openai-completions"` é usado com Ollama, o OpenClaw injeta `options.num_ctx` por padrão para que o Ollama não volte silenciosamente para uma janela de contexto de 4096. Se seu proxy/upstream rejeitar campos `options` desconhecidos, desative esse comportamento:

```json5
{
  models: {
    providers: {
      ollama: {
        baseUrl: "http://ollama-host:11434/v1",
        api: "openai-completions",
        injectNumCtxForOpenAICompat: false,
        apiKey: "ollama-local",
        models: [...]
      }
    }
  }
}
```

### Janelas de contexto

Para modelos descobertos automaticamente, o OpenClaw usa a janela de contexto informada pelo Ollama quando disponível; caso contrário, ele usa a janela de contexto padrão do Ollama usada pelo OpenClaw. Você pode substituir `contextWindow` e `maxTokens` na configuração explícita do provedor.

## Solução de problemas

### Ollama não detectado

Verifique se o Ollama está em execução, se você definiu `OLLAMA_API_KEY` (ou um perfil de auth) e se **não** definiu uma entrada explícita `models.providers.ollama`:

```bash
ollama serve
```

E se a API está acessível:

```bash
curl http://localhost:11434/api/tags
```

### Nenhum modelo disponível

Se o seu modelo não estiver listado, faça uma destas opções:

- Faça `pull` do modelo localmente, ou
- Defina o modelo explicitamente em `models.providers.ollama`.

Para adicionar modelos:

```bash
ollama list  # Veja o que está instalado
ollama pull gemma4
ollama pull gpt-oss:20b
ollama pull llama3.3     # Ou outro modelo
```

### Conexão recusada

Verifique se o Ollama está em execução na porta correta:

```bash
# Verifique se o Ollama está em execução
ps aux | grep ollama

# Ou reinicie o Ollama
ollama serve
```

## Veja também

- [Provedores de modelo](/pt-BR/concepts/model-providers) - Visão geral de todos os provedores
- [Seleção de modelo](/pt-BR/concepts/models) - Como escolher modelos
- [Configuração](/pt-BR/gateway/configuration) - Referência completa de configuração
