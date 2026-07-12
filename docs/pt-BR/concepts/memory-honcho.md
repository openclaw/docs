---
read_when:
    - Você quer uma memória persistente que funcione entre sessões e canais
    - Você quer recuperação de informações e modelagem de usuários com tecnologia de IA
summary: Memória nativa de IA entre sessões por meio do plugin Honcho
title: Memória do Honcho
x-i18n:
    generated_at: "2026-07-12T15:05:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: fadcf6d8e2505ab4fe6a81340695b7c8fee49c3cb4889665af13389941619117
    source_path: concepts/memory-honcho.md
    workflow: 16
---

[Honcho](https://honcho.dev) adiciona memória nativa de IA ao OpenClaw por meio de um
plugin externo. Ele persiste as conversas em um serviço dedicado e cria
modelos do usuário e do agente ao longo do tempo, oferecendo ao seu agente um contexto entre sessões que
vai além dos arquivos Markdown do espaço de trabalho.

## O que ele oferece

- **Memória entre sessões** - as conversas persistem após cada turno, permitindo que
  o contexto seja mantido entre redefinições de sessão, Compaction e trocas de canal.
- **Modelagem de usuário** - o Honcho mantém um perfil para cada usuário (preferências,
  fatos, estilo de comunicação) e para o agente (personalidade, comportamentos
  aprendidos).
- **Pesquisa semântica** - pesquisa observações de conversas anteriores, não
  apenas da sessão atual.
- **Percepção de múltiplos agentes** - agentes pai acompanham automaticamente os
  subagentes iniciados, com os pais adicionados como observadores nas sessões filhas.

## Ferramentas disponíveis

O Honcho registra ferramentas que o agente pode usar durante a conversa:

**Recuperação de dados (rápida, sem chamada ao LLM):**

| Ferramenta                  | O que faz                                                     |
| --------------------------- | ------------------------------------------------------------- |
| `honcho_context`            | Representação completa do usuário entre sessões               |
| `honcho_search_conclusions` | Pesquisa semântica nas conclusões armazenadas                 |
| `honcho_search_messages`    | Encontra mensagens entre sessões (filtra por remetente, data) |
| `honcho_session`            | Histórico e resumo da sessão atual                            |

**Perguntas e respostas (com tecnologia de LLM):**

| Ferramenta   | O que faz                                                                         |
| ------------ | --------------------------------------------------------------------------------- |
| `honcho_ask` | Faz perguntas sobre o usuário. `depth='quick'` para fatos, `'thorough'` para síntese |

## Primeiros passos

Instale o plugin e execute a configuração:

```bash
openclaw plugins install @honcho-ai/openclaw-honcho
openclaw honcho setup
openclaw gateway --force
```

O comando de configuração solicita suas credenciais de API, grava a configuração e
migra opcionalmente os arquivos de memória existentes no espaço de trabalho.

<Info>
O Honcho pode ser executado inteiramente no ambiente local (auto-hospedado) ou por meio da API gerenciada em
`api.honcho.dev`. A opção auto-hospedada não exige dependências
externas.
</Info>

## Configuração

As configurações ficam em `plugins.entries["openclaw-honcho"].config`:

```json5
{
  plugins: {
    entries: {
      "openclaw-honcho": {
        config: {
          apiKey: "your-api-key", // omita para auto-hospedagem
          workspaceId: "openclaw", // isolamento de memória
          baseUrl: "https://api.honcho.dev",
        },
      },
    },
  },
}
```

Para instâncias auto-hospedadas, defina `baseUrl` para apontar ao seu servidor local (por exemplo,
`http://localhost:8000`) e omita a chave de API.

## Migração da memória existente

Se você tiver arquivos de memória existentes no espaço de trabalho (`USER.md`, `MEMORY.md`,
`IDENTITY.md`, `memory/`, `canvas/`), `openclaw honcho setup` os detectará e
oferecerá a opção de migrá-los.

<Info>
A migração não é destrutiva — os arquivos são enviados ao Honcho. Os originais
nunca são excluídos nem movidos.
</Info>

## Como funciona

Após cada turno da IA, a conversa é persistida no Honcho. Tanto as mensagens do
usuário quanto as do agente são observadas, permitindo que o Honcho crie e refine seus modelos ao
longo do tempo.

Durante a conversa, as ferramentas do Honcho consultam o serviço por meio do hook de plugin
`before_prompt_build` do OpenClaw, injetando o contexto relevante antes que o modelo
receba o prompt.

## Honcho em comparação com a memória integrada

|                    | Integrada / QMD                       | Honcho                                  |
| ------------------ | ------------------------------------- | --------------------------------------- |
| **Armazenamento**  | Arquivos Markdown do espaço de trabalho | Serviço dedicado (local ou hospedado)   |
| **Entre sessões**  | Por meio de arquivos de memória       | Automático e integrado                  |
| **Modelagem de usuário** | Manual (gravação em MEMORY.md)  | Perfis automáticos                      |
| **Pesquisa**       | Vetorial + palavra-chave (híbrida)    | Semântica sobre observações             |
| **Múltiplos agentes** | Não rastreados                     | Percepção da relação pai/filho          |
| **Dependências**   | Nenhuma (integrada) ou binário QMD    | Instalação do plugin                    |

O Honcho e o sistema de memória integrado podem funcionar em conjunto. Quando o QMD está
configurado, ferramentas adicionais ficam disponíveis para pesquisar arquivos Markdown locais
junto à memória entre sessões do Honcho.

## Comandos da CLI

```bash
openclaw honcho setup                        # Configurar a chave da API e migrar arquivos
openclaw honcho status                       # Verificar o status da conexão
openclaw honcho ask <question>               # Consultar o Honcho sobre o usuário
openclaw honcho search <query> [-k N] [-d D] # Pesquisa semântica na memória
```

## Leitura adicional

- [Código-fonte do plugin](https://github.com/plastic-labs/openclaw-honcho)
- [Documentação do Honcho](https://docs.honcho.dev)
- [Guia de integração do Honcho com o OpenClaw](https://docs.honcho.dev/v3/guides/integrations/openclaw)

## Relacionado

- [Visão geral da memória](/pt-BR/concepts/memory)
- [Mecanismo de memória integrado](/pt-BR/concepts/memory-builtin)
- [Mecanismo de memória QMD](/pt-BR/concepts/memory-qmd)
- [Mecanismos de contexto](/pt-BR/concepts/context-engine)
