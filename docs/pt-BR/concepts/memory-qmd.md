---
read_when:
    - Você quer configurar o QMD como seu backend de memória
    - Você quer recursos avançados de memória, como reranking ou caminhos extras indexados
summary: Sidecar de pesquisa local-first com BM25, vetores, reranking e expansão de consulta
title: Mecanismo de memória QMD
x-i18n:
    generated_at: "2026-04-24T05:48:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7d7af326291e194a04a17aa425901bf7e2517c23bae8282cd504802d24e9e522
    source_path: concepts/memory-qmd.md
    workflow: 15
---

[QMD](https://github.com/tobi/qmd) é um sidecar de pesquisa local-first executado
ao lado do OpenClaw. Ele combina BM25, pesquisa vetorial e reranking em um único
binário, e pode indexar conteúdo além dos arquivos de memória do seu workspace.

## O que ele adiciona em relação ao integrado

- **Reranking e expansão de consulta** para melhor recuperação.
- **Indexar diretórios extras** -- documentação do projeto, notas da equipe, qualquer coisa em disco.
- **Indexar transcrições de sessão** -- recuperar conversas anteriores.
- **Totalmente local** -- executa via Bun + node-llama-cpp, baixa automaticamente modelos GGUF.
- **Fallback automático** -- se o QMD não estiver disponível, o OpenClaw volta para o
  mecanismo integrado sem interrupções.

## Primeiros passos

### Pré-requisitos

- Instale o QMD: `npm install -g @tobilu/qmd` ou `bun install -g @tobilu/qmd`
- Build do SQLite que permita extensões (`brew install sqlite` no macOS).
- O QMD deve estar no `PATH` do gateway.
- macOS e Linux funcionam imediatamente. O Windows é melhor suportado via WSL2.

### Ativar

```json5
{
  memory: {
    backend: "qmd",
  },
}
```

O OpenClaw cria um diretório home autocontido do QMD em
`~/.openclaw/agents/<agentId>/qmd/` e gerencia automaticamente o ciclo de vida do sidecar
-- coleções, atualizações e execuções de embedding são tratadas para você.
Ele prefere os formatos atuais de coleção do QMD e de consulta MCP, mas ainda faz fallback para
flags legadas de coleção `--mask` e nomes antigos de ferramenta MCP quando necessário.
A reconciliação na inicialização também recria coleções gerenciadas obsoletas de volta para seus
padrões canônicos quando uma coleção mais antiga do QMD com o mesmo nome ainda está
presente.

## Como o sidecar funciona

- O OpenClaw cria coleções a partir dos seus arquivos de memória do workspace e de quaisquer
  `memory.qmd.paths` configurados, depois executa `qmd update` + `qmd embed` na inicialização
  e periodicamente (padrão a cada 5 minutos).
- A coleção padrão do workspace rastreia `MEMORY.md` mais a árvore `memory/`.
  `memory.md` em minúsculas não é indexado como arquivo raiz de memória.
- A atualização na inicialização é executada em segundo plano, para que a inicialização do chat não seja bloqueada.
- As pesquisas usam o `searchMode` configurado (padrão: `search`; também oferece suporte a
  `vsearch` e `query`). Se um modo falhar, o OpenClaw tenta novamente com `qmd query`.
- Se o QMD falhar completamente, o OpenClaw volta para o mecanismo SQLite integrado.

<Info>
A primeira pesquisa pode ser lenta -- o QMD baixa automaticamente modelos GGUF (~2 GB) para
reranking e expansão de consulta na primeira execução de `qmd query`.
</Info>

## Substituições de modelo

Variáveis de ambiente de modelo do QMD são repassadas sem alterações a partir do processo
do gateway, então você pode ajustar o QMD globalmente sem adicionar nova configuração do OpenClaw:

```bash
export QMD_EMBED_MODEL="hf:Qwen/Qwen3-Embedding-0.6B-GGUF/Qwen3-Embedding-0.6B-Q8_0.gguf"
export QMD_RERANK_MODEL="/absolute/path/to/reranker.gguf"
export QMD_GENERATE_MODEL="/absolute/path/to/generator.gguf"
```

Depois de alterar o modelo de embedding, execute novamente os embeddings para que o índice corresponda ao
novo espaço vetorial.

## Indexar caminhos extras

Aponte o QMD para diretórios adicionais para torná-los pesquisáveis:

```json5
{
  memory: {
    backend: "qmd",
    qmd: {
      paths: [{ name: "docs", path: "~/notes", pattern: "**/*.md" }],
    },
  },
}
```

Trechos de caminhos extras aparecem como `qmd/<collection>/<relative-path>` em
resultados de pesquisa. `memory_get` entende esse prefixo e lê a partir da raiz correta
da coleção.

## Indexar transcrições de sessão

Ative a indexação de sessão para recuperar conversas anteriores:

```json5
{
  memory: {
    backend: "qmd",
    qmd: {
      sessions: { enabled: true },
    },
  },
}
```

As transcrições são exportadas como turnos saneados de Usuário/Assistente para uma coleção QMD
dedicada em `~/.openclaw/agents/<id>/qmd/sessions/`.

## Escopo de pesquisa

Por padrão, os resultados de pesquisa do QMD aparecem em sessões diretas e de canal
(não em grupos). Configure `memory.qmd.scope` para alterar isso:

```json5
{
  memory: {
    qmd: {
      scope: {
        default: "deny",
        rules: [{ action: "allow", match: { chatType: "direct" } }],
      },
    },
  },
}
```

Quando o escopo nega uma pesquisa, o OpenClaw registra um aviso com o canal derivado e
o tipo de chat, para que resultados vazios sejam mais fáceis de depurar.

## Citações

Quando `memory.citations` é `auto` ou `on`, trechos de pesquisa incluem um
rodapé `Source: <path#line>`. Defina `memory.citations = "off"` para omitir o rodapé
e ainda assim passar o caminho internamente ao agente.

## Quando usar

Escolha o QMD quando você precisar de:

- Reranking para resultados de maior qualidade.
- Pesquisar documentação do projeto ou notas fora do workspace.
- Recuperar conversas de sessões passadas.
- Pesquisa totalmente local sem chaves de API.

Para configurações mais simples, o [mecanismo integrado](/pt-BR/concepts/memory-builtin) funciona bem
sem dependências extras.

## Solução de problemas

**QMD não encontrado?** Verifique se o binário está no `PATH` do gateway. Se o OpenClaw
estiver em execução como serviço, crie um link simbólico:
`sudo ln -s ~/.bun/bin/qmd /usr/local/bin/qmd`.

**Primeira pesquisa muito lenta?** O QMD baixa modelos GGUF no primeiro uso. Faça aquecimento
prévio com `qmd query "test"` usando os mesmos diretórios XDG que o OpenClaw usa.

**A pesquisa expira?** Aumente `memory.qmd.limits.timeoutMs` (padrão: 4000ms).
Defina como `120000` para hardware mais lento.

**Resultados vazios em chats de grupo?** Verifique `memory.qmd.scope` -- o padrão só
permite sessões diretas e de canal.

**A pesquisa na memória raiz de repente ficou ampla demais?** Reinicie o gateway ou aguarde a
próxima reconciliação na inicialização. O OpenClaw recria coleções gerenciadas obsoletas
de volta para os padrões canônicos `MEMORY.md` e `memory/` quando detecta um conflito
de mesmo nome.

**Repositórios temporários visíveis no workspace causando `ENAMETOOLONG` ou indexação quebrada?**
Atualmente, a travessia do QMD segue o comportamento do scanner subjacente do QMD em vez das
regras integradas de links simbólicos do OpenClaw. Mantenha checkouts temporários de monorepo em
diretórios ocultos como `.tmp/` ou fora das raízes QMD indexadas até que o QMD exponha
travessia segura contra ciclos ou controles explícitos de exclusão.

## Configuração

Para a superfície completa de configuração (`memory.qmd.*`), modos de pesquisa, intervalos
de atualização, regras de escopo e todos os demais ajustes, consulte a
[Referência de configuração de memória](/pt-BR/reference/memory-config).

## Relacionado

- [Visão geral da memória](/pt-BR/concepts/memory)
- [Mecanismo de memória integrado](/pt-BR/concepts/memory-builtin)
- [Memória Honcho](/pt-BR/concepts/memory-honcho)
