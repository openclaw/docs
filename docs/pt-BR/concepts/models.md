---
read_when:
    - Adicionando ou modificando a CLI de modelos (`models list/set/scan/aliases/fallbacks`)
    - Alterando o comportamento de fallback de modelos ou a UX de seleção
    - Atualizando as sondas de varredura de modelos (`tools/images`)
summary: 'CLI de modelos: listar, definir, aliases, fallbacks, varredura, status'
title: CLI de modelos
x-i18n:
    generated_at: "2026-04-22T04:22:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0cf7a17a20bea66e5e8dce134ed08b483417bc70ed875e796609d850aa79280e
    source_path: concepts/models.md
    workflow: 15
---

# CLI de modelos

Consulte [/concepts/model-failover](/pt-BR/concepts/model-failover) para
rotação de perfis de autenticação, cooldowns e como isso interage com os fallbacks.
Visão geral rápida de provedores + exemplos: [/concepts/model-providers](/pt-BR/concepts/model-providers).

## Como a seleção de modelos funciona

O OpenClaw seleciona modelos nesta ordem:

1. **Primário** (`agents.defaults.model.primary` ou `agents.defaults.model`).
2. **Fallbacks** em `agents.defaults.model.fallbacks` (em ordem).
3. O **failover de autenticação do provedor** acontece dentro de um provedor antes de passar para o
   próximo modelo.

Relacionado:

- `agents.defaults.models` é a lista de permissões/catálogo de modelos que o OpenClaw pode usar (além de aliases).
- `agents.defaults.imageModel` é usado **somente quando** o modelo primário não pode aceitar imagens.
- `agents.defaults.pdfModel` é usado pela ferramenta `pdf`. Se omitido, a ferramenta
  usa como fallback `agents.defaults.imageModel` e, em seguida, o modelo de sessão/padrão resolvido.
- `agents.defaults.imageGenerationModel` é usado pela capacidade compartilhada de geração de imagens. Se omitido, `image_generate` ainda pode inferir um padrão de provedor com autenticação. Ele tenta primeiro o provedor padrão atual e, depois, os demais provedores registrados de geração de imagens em ordem de `provider-id`. Se você definir um provedor/modelo específico, configure também a autenticação/chave de API desse provedor.
- `agents.defaults.musicGenerationModel` é usado pela capacidade compartilhada de geração de música. Se omitido, `music_generate` ainda pode inferir um padrão de provedor com autenticação. Ele tenta primeiro o provedor padrão atual e, depois, os demais provedores registrados de geração de música em ordem de `provider-id`. Se você definir um provedor/modelo específico, configure também a autenticação/chave de API desse provedor.
- `agents.defaults.videoGenerationModel` é usado pela capacidade compartilhada de geração de vídeo. Se omitido, `video_generate` ainda pode inferir um padrão de provedor com autenticação. Ele tenta primeiro o provedor padrão atual e, depois, os demais provedores registrados de geração de vídeo em ordem de `provider-id`. Se você definir um provedor/modelo específico, configure também a autenticação/chave de API desse provedor.
- Os padrões por agente podem substituir `agents.defaults.model` por meio de `agents.list[].model` além de vínculos (consulte [/concepts/multi-agent](/pt-BR/concepts/multi-agent)).

## Política rápida de modelos

- Defina seu primário como o modelo mais forte e da geração mais recente disponível para você.
- Use fallbacks para tarefas sensíveis a custo/latência e chats de menor importância.
- Para agentes com ferramentas habilitadas ou entradas não confiáveis, evite níveis de modelo mais antigos/mais fracos.

## Onboarding (recomendado)

Se você não quiser editar a configuração manualmente, execute o onboarding:

```bash
openclaw onboard
```

Ele pode configurar modelo + autenticação para provedores comuns, incluindo **OpenAI Code (Codex)
subscription** (OAuth) e **Anthropic** (chave de API ou Claude CLI).

## Chaves de configuração (visão geral)

- `agents.defaults.model.primary` e `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` e `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` e `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` e `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` e `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models` (lista de permissões + aliases + parâmetros de provedor)
- `models.providers` (provedores personalizados gravados em `models.json`)

As referências de modelo são normalizadas para minúsculas. Aliases de provedor como `z.ai/*` são normalizados
para `zai/*`.

Exemplos de configuração de provedor (incluindo OpenCode) estão em
[/providers/opencode](/pt-BR/providers/opencode).

## "Model is not allowed" (e por que as respostas param)

Se `agents.defaults.models` estiver definido, ele se torna a **lista de permissões** para `/model` e para
substituições de sessão. Quando um usuário seleciona um modelo que não está nessa lista de permissões,
o OpenClaw retorna:

```
Model "provider/model" is not allowed. Use /model to list available models.
```

Isso acontece **antes** de uma resposta normal ser gerada, então a mensagem pode dar a sensação
de que “não respondeu”. A correção é uma destas:

- Adicionar o modelo a `agents.defaults.models`, ou
- Limpar a lista de permissões (remover `agents.defaults.models`), ou
- Escolher um modelo em `/model list`.

Exemplo de configuração de lista de permissões:

```json5
{
  agent: {
    model: { primary: "anthropic/claude-sonnet-4-6" },
    models: {
      "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
      "anthropic/claude-opus-4-6": { alias: "Opus" },
    },
  },
}
```

## Mudando modelos no chat (`/model`)

Você pode mudar os modelos da sessão atual sem reiniciar:

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model status
```

Observações:

- `/model` (e `/model list`) é um seletor compacto numerado (família do modelo + provedores disponíveis).
- No Discord, `/model` e `/models` abrem um seletor interativo com menus suspensos de provedor e modelo, além de uma etapa de envio.
- `/model <#>` seleciona a partir desse seletor.
- `/model` persiste imediatamente a nova seleção de sessão.
- Se o agente estiver ocioso, a próxima execução usará o novo modelo imediatamente.
- Se uma execução já estiver ativa, o OpenClaw marca uma troca ao vivo como pendente e só reinicia no novo modelo em um ponto limpo de retry.
- Se a atividade de ferramenta ou a saída de resposta já tiver começado, a troca pendente pode permanecer na fila até uma oportunidade posterior de retry ou o próximo turno do usuário.
- `/model status` é a visualização detalhada (candidatos de autenticação e, quando configurado, `baseUrl` do endpoint do provedor + modo `api`).
- As referências de modelo são analisadas dividindo na **primeira** `/`. Use `provider/model` ao digitar `/model <ref>`.
- Se o próprio ID do modelo contiver `/` (estilo OpenRouter), você deverá incluir o prefixo do provedor (exemplo: `/model openrouter/moonshotai/kimi-k2`).
- Se você omitir o provedor, o OpenClaw resolve a entrada nesta ordem:
  1. correspondência de alias
  2. correspondência única de provedor configurado para esse ID de modelo exato sem prefixo
  3. fallback obsoleto para o provedor padrão configurado
     Se esse provedor não expuser mais o modelo padrão configurado, o OpenClaw
     usará como fallback o primeiro provedor/modelo configurado para evitar
     exibir um padrão obsoleto de provedor removido.

Comportamento/configuração completa do comando: [Comandos slash](/pt-BR/tools/slash-commands).

## Comandos da CLI

```bash
openclaw models list
openclaw models status
openclaw models set <provider/model>
openclaw models set-image <provider/model>

openclaw models aliases list
openclaw models aliases add <alias> <provider/model>
openclaw models aliases remove <alias>

openclaw models fallbacks list
openclaw models fallbacks add <provider/model>
openclaw models fallbacks remove <provider/model>
openclaw models fallbacks clear

openclaw models image-fallbacks list
openclaw models image-fallbacks add <provider/model>
openclaw models image-fallbacks remove <provider/model>
openclaw models image-fallbacks clear
```

`openclaw models` (sem subcomando) é um atalho para `models status`.

### `models list`

Mostra os modelos configurados por padrão. Flags úteis:

- `--all`: catálogo completo
- `--local`: somente provedores locais
- `--provider <name>`: filtrar por provedor
- `--plain`: um modelo por linha
- `--json`: saída legível por máquina

`--all` inclui linhas de catálogo estático incluídas e pertencentes ao provedor antes que a autenticação esteja
configurada, então visualizações somente de descoberta podem mostrar modelos indisponíveis até
que você adicione credenciais correspondentes do provedor.

### `models status`

Mostra o modelo primário resolvido, os fallbacks, o modelo de imagem e uma visão geral de autenticação
dos provedores configurados. Também mostra o status de expiração do OAuth para perfis encontrados
no armazenamento de autenticação (avisa dentro de 24h por padrão). `--plain` imprime apenas o
modelo primário resolvido.
O status de OAuth é sempre mostrado (e incluído na saída `--json`). Se um provedor configurado
não tiver credenciais, `models status` imprime uma seção **Missing auth**.
O JSON inclui `auth.oauth` (janela de aviso + perfis) e `auth.providers`
(autenticação efetiva por provedor, incluindo credenciais vindas do ambiente). `auth.oauth`
é apenas a integridade dos perfis no armazenamento de autenticação; provedores somente com env não aparecem ali.
Use `--check` para automação (saída `1` quando ausente/expirado, `2` quando estiver para expirar).
Use `--probe` para verificações ativas de autenticação; as linhas de probe podem vir de perfis de autenticação, credenciais de ambiente
ou `models.json`.
Se `auth.order.<provider>` explícito omitir um perfil armazenado, o probe reporta
`excluded_by_auth_order` em vez de tentar usá-lo. Se a autenticação existir, mas nenhum modelo sondável
puder ser resolvido para esse provedor, o probe reporta `status: no_model`.

A escolha de autenticação depende do provedor/conta. Para hosts de Gateway sempre ativos, chaves de API
costumam ser a opção mais previsível; a reutilização do Claude CLI e perfis OAuth/token
existentes da Anthropic também são compatíveis.

Exemplo (Claude CLI):

```bash
claude auth login
openclaw models status
```

## Varredura (modelos gratuitos do OpenRouter)

`openclaw models scan` inspeciona o **catálogo de modelos gratuitos** do OpenRouter e pode
opcionalmente sondar modelos para suporte a ferramentas e imagens.

Flags principais:

- `--no-probe`: pular probes ativos (somente metadados)
- `--min-params <b>`: tamanho mínimo de parâmetros (bilhões)
- `--max-age-days <days>`: pular modelos mais antigos
- `--provider <name>`: filtro por prefixo de provedor
- `--max-candidates <n>`: tamanho da lista de fallback
- `--set-default`: definir `agents.defaults.model.primary` como a primeira seleção
- `--set-image`: definir `agents.defaults.imageModel.primary` como a primeira seleção de imagem

Os probes exigem uma chave de API do OpenRouter (de perfis de autenticação ou
`OPENROUTER_API_KEY`). Sem uma chave, use `--no-probe` para listar apenas os candidatos.

Os resultados da varredura são classificados por:

1. Suporte a imagens
2. Latência de ferramentas
3. Tamanho de contexto
4. Quantidade de parâmetros

Entrada

- Lista `/models` do OpenRouter (filtro `:free`)
- Exige chave de API do OpenRouter de perfis de autenticação ou `OPENROUTER_API_KEY` (consulte [/environment](/pt-BR/help/environment))
- Filtros opcionais: `--max-age-days`, `--min-params`, `--provider`, `--max-candidates`
- Controles de probe: `--timeout`, `--concurrency`

Quando executado em um TTY, você pode selecionar fallbacks interativamente. No modo não interativo,
passe `--yes` para aceitar os padrões.

## Registro de modelos (`models.json`)

Provedores personalizados em `models.providers` são gravados em `models.json` no
diretório do agente (padrão `~/.openclaw/agents/<agentId>/agent/models.json`). Esse arquivo
é mesclado por padrão, a menos que `models.mode` esteja definido como `replace`.

Precedência do modo de mesclagem para IDs de provedor correspondentes:

- `baseUrl` não vazio já presente no `models.json` do agente vence.
- `apiKey` não vazio no `models.json` do agente vence apenas quando esse provedor não é gerenciado por SecretRef no contexto atual de configuração/perfil de autenticação.
- Valores de `apiKey` de provedor gerenciados por SecretRef são atualizados a partir de marcadores de origem (`ENV_VAR_NAME` para refs de ambiente, `secretref-managed` para refs de arquivo/exec) em vez de persistir segredos resolvidos.
- Valores de cabeçalho de provedor gerenciados por SecretRef são atualizados a partir de marcadores de origem (`secretref-env:ENV_VAR_NAME` para refs de ambiente, `secretref-managed` para refs de arquivo/exec).
- `apiKey`/`baseUrl` vazios ou ausentes no agente usam como fallback `models.providers` da configuração.
- Outros campos do provedor são atualizados a partir da configuração e de dados normalizados do catálogo.

A persistência de marcadores é autoritativa pela origem: o OpenClaw grava marcadores a partir do snapshot ativo da configuração de origem (pré-resolução), não a partir de valores secretos resolvidos em runtime.
Isso se aplica sempre que o OpenClaw regenera `models.json`, incluindo caminhos orientados por comando como `openclaw agent`.

## Relacionado

- [Provedores de modelo](/pt-BR/concepts/model-providers) — roteamento e autenticação de provedores
- [Failover de modelo](/pt-BR/concepts/model-failover) — cadeias de fallback
- [Geração de imagens](/pt-BR/tools/image-generation) — configuração do modelo de imagem
- [Geração de música](/pt-BR/tools/music-generation) — configuração do modelo de música
- [Geração de vídeo](/pt-BR/tools/video-generation) — configuração do modelo de vídeo
- [Referência de configuração](/pt-BR/gateway/configuration-reference#agent-defaults) — chaves de configuração de modelo
