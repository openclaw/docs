---
doc-schema-version: 1
read_when:
    - Você quer encontrar plugins de terceiros para o OpenClaw
    - Você quer publicar ou listar seu próprio plugin no ClawHub
summary: Encontre e publique plugins do OpenClaw mantidos pela comunidade
title: Plugins da comunidade
x-i18n:
    generated_at: "2026-07-12T00:09:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6a9eb477f20da8171a35c22ea6b112d77ff4afe0878f60314c052746aef4e0ac
    source_path: plugins/community.md
    workflow: 16
---

Plugins da comunidade são pacotes de terceiros que ampliam o OpenClaw com
canais, ferramentas, provedores, hooks ou outros recursos. Use o
[ClawHub](/clawhub) como a principal plataforma de descoberta de Plugins
públicos da comunidade.

## Encontrar Plugins

Pesquise no ClawHub pela CLI:

```bash
openclaw plugins search "calendar"
```

Instale um Plugin do ClawHub com um prefixo de origem explícito:

```bash
openclaw plugins install clawhub:<package-name>
```

O npm continua sendo um caminho compatível para instalação direta durante a transição de lançamento:

```bash
openclaw plugins install npm:<package-name>
```

Use [Gerenciar Plugins](/pt-BR/plugins/manage-plugins) para ver exemplos comuns de instalação, atualização,
inspeção e desinstalação. Use [`openclaw plugins`](/pt-BR/cli/plugins) para consultar
a referência completa dos comandos e as regras de seleção de origem.

## Publicar Plugins

Publique Plugins públicos da comunidade no ClawHub para que os usuários do OpenClaw possam encontrá-los
e instalá-los. O ClawHub gerencia a listagem ativa de pacotes, o histórico de versões,
o status da verificação e as instruções de instalação; a documentação não mantém um catálogo
estático de Plugins de terceiros.

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Antes de publicar, certifique-se de que o Plugin tenha metadados do pacote, um
manifesto do Plugin, documentação de configuração e um responsável pela manutenção claramente definido. O ClawHub valida o
escopo do proprietário, o nome do pacote, a versão, os limites de arquivos e os metadados da origem antes de
criar uma versão e, em seguida, mantém as novas versões ocultas das interfaces normais de instalação e
download até a conclusão da revisão e da verificação.

Lista de verificação antes da publicação:

| Requisito              | Motivo                                                               |
| ---------------------- | -------------------------------------------------------------------- |
| Publicado no ClawHub   | Os usuários precisam que as instruções de `openclaw plugins install` funcionem |
| Repositório público no GitHub | Revisão do código-fonte, acompanhamento de problemas e transparência |
| Documentação de configuração e uso | Os usuários precisam saber como configurá-lo                  |
| Manutenção ativa       | Atualizações recentes ou tratamento ágil de problemas                |

Contrato completo de publicação:

- [Publicação no ClawHub](/pt-BR/clawhub/publishing) - proprietários, escopos, versões,
  revisão, validação de pacotes e transferência de pacotes
- [Criação de Plugins](/pt-BR/plugins/building-plugins) - a estrutura do pacote do Plugin
  e o fluxo de trabalho da primeira publicação
- [Manifesto do Plugin](/pt-BR/plugins/manifest) - campos do manifesto nativo do Plugin

## Relacionados

- [Plugins](/pt-BR/tools/plugin) - instalar, configurar, reiniciar e solucionar problemas
- [Gerenciar Plugins](/pt-BR/plugins/manage-plugins) - exemplos de comandos
- [Publicação no ClawHub](/pt-BR/clawhub/publishing) - regras de publicação e lançamento
