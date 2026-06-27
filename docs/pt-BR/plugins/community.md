---
doc-schema-version: 1
read_when:
    - Você quer encontrar plugins de terceiros do OpenClaw
    - Você quer publicar ou listar seu próprio Plugin no ClawHub
summary: Encontre e publique plugins OpenClaw mantidos pela comunidade
title: Plugins da comunidade
x-i18n:
    generated_at: "2026-06-27T17:46:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0ecf059fa0c32f09d09381b2153a6a63ca522d49719aaa8476209389a6b5b36a
    source_path: plugins/community.md
    workflow: 16
---

Plugins da comunidade são pacotes de terceiros que estendem o OpenClaw com canais,
ferramentas, provedores, hooks ou outros recursos. Use [ClawHub](/pt-BR/clawhub) como a
principal superfície de descoberta para plugins públicos da comunidade.

## Encontrar plugins

Pesquise no ClawHub pela CLI:

```bash
openclaw plugins search "calendar"
```

Instale um Plugin do ClawHub com um prefixo de fonte explícito:

```bash
openclaw plugins install clawhub:<package-name>
```

npm continua sendo um caminho de instalação direta compatível durante a transição
de lançamento:

```bash
openclaw plugins install npm:<package-name>
```

Use [Gerenciar plugins](/pt-BR/plugins/manage-plugins) para exemplos comuns de
instalação, atualização, inspeção e desinstalação. Use
[`openclaw plugins`](/pt-BR/cli/plugins) para a referência completa de comandos e as
regras de seleção de fonte.

## Publicar plugins

Publique plugins públicos da comunidade no ClawHub quando quiser que usuários do
OpenClaw possam descobri-los e instalá-los. O ClawHub é responsável pela listagem
ativa de pacotes, histórico de versões, status de varredura e dicas de
instalação; a documentação não mantém um catálogo estático de plugins de
terceiros.

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Antes de publicar, confirme que o Plugin tem metadados de pacote, um manifesto de
Plugin, documentação de configuração e um responsável claro pela manutenção. O
ClawHub valida o escopo do proprietário, nome do pacote, versão, limites de
arquivos e metadados de origem antes de criar uma versão, e então mantém novas
versões ocultas das superfícies normais de instalação e download até que a
revisão e a verificação sejam concluídas.

Use esta lista de verificação antes de publicar:

| Requisito            | Por quê                                             |
| -------------------- | --------------------------------------------------- |
| Publicado no ClawHub | Usuários precisam que dicas de `openclaw plugins install` funcionem |
| Repositório público no GitHub | Revisão de código-fonte, acompanhamento de issues, transparência |
| Documentação de configuração e uso | Usuários precisam saber como configurá-lo |
| Manutenção ativa     | Atualizações recentes ou tratamento responsivo de issues |

Use estas páginas para o contrato completo de publicação:

- [Publicação no ClawHub](/pt-BR/clawhub/publishing) explica proprietários, escopos,
  versões, revisão, validação de pacotes e transferência de pacotes.
- [Criação de plugins](/pt-BR/plugins/building-plugins) mostra o formato do pacote de
  Plugin e o primeiro fluxo de publicação.
- [Manifesto do Plugin](/pt-BR/plugins/manifest) define os campos do manifesto de
  Plugin nativo.

## Relacionado

- [Plugins](/pt-BR/tools/plugin) - instalar, configurar, reiniciar e solucionar problemas
- [Gerenciar plugins](/pt-BR/plugins/manage-plugins) - exemplos de comandos
- [Publicação no ClawHub](/pt-BR/clawhub/publishing) - regras de publicação e versão
