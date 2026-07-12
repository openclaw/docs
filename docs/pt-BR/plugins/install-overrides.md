---
read_when:
    - Testando fluxos de integração ou configuração com um Plugin empacotado localmente
    - Verificando um pacote de plugin antes de publicá-lo
    - Substituindo a instalação automática de um plugin por um artefato de teste
sidebarTitle: Install overrides
summary: Teste as substituições de plugins empacotados com fluxos de instalação durante a configuração
title: Substituições de instalação de Plugin
x-i18n:
    generated_at: "2026-07-12T00:10:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: adc823f49ea9f8fa86e6a89933e43fdc309d808ac24397770495dbe81cb4b0d7
    source_path: plugins/install-overrides.md
    workflow: 16
---

As substituições de instalação de Plugins permitem que os mantenedores direcionem instalações de Plugins durante a configuração para
um pacote npm específico ou um tarball local gerado por `npm pack`, em vez da origem do catálogo,
integrada ou padrão do npm. Elas existem somente para E2E e validação de pacotes;
usuários comuns instalam Plugins com
[`openclaw plugins install`](/pt-BR/cli/plugins).

<Warning>
As substituições executam código de Plugin da origem fornecida. Use-as somente em um
diretório de estado isolado ou em uma máquina de teste descartável.
</Warning>

## Ambiente

As substituições ficam desativadas, a menos que ambas as variáveis estejam definidas:

```bash
export OPENCLAW_ALLOW_PLUGIN_INSTALL_OVERRIDES=1
export OPENCLAW_PLUGIN_INSTALL_OVERRIDES='{
  "codex": "npm-pack:/tmp/openclaw-codex-2026.5.8.tgz",
  "openclaw-web-search": "npm:@openclaw/web-search@2026.5.8"
}'
```

O mapa de substituições é um JSON indexado pelo id do Plugin. Os valores aceitam:

| Prefixo               | Origem                                                                                                             |
| --------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `npm:<registry-spec>` | Pacotes do registro, versões exatas ou tags                                                                        |
| `npm-pack:<path.tgz>` | Tarballs locais produzidos por `npm pack`; caminhos relativos são resolvidos a partir do diretório de trabalho atual |

## Comportamento

Quando um fluxo de configuração instala um Plugin cujo id aparece no mapa, o OpenClaw
usa a origem de substituição em vez da origem do catálogo, integrada ou padrão do npm.
Isso se aplica à integração inicial e a qualquer outro fluxo que use o instalador
compartilhado de Plugins durante a configuração.

- As substituições ainda impõem o id de Plugin esperado: um tarball mapeado para `codex`
  deve instalar um Plugin cujo id no manifesto seja `codex`.
- As substituições não herdam o status oficial de origem confiável. Mesmo quando a
  entrada do catálogo normalmente representa um pacote pertencente ao OpenClaw, uma substituição é
  tratada como entrada de teste fornecida pelo operador.
- Arquivos `.env` do espaço de trabalho não podem habilitar substituições de instalação; ambas as variáveis de ambiente estão na
  lista bloqueada de dotenv do espaço de trabalho. Defina-as no shell confiável, no trabalho de CI ou no
  comando de teste remoto que inicia o OpenClaw.

## E2E de pacote

Use um diretório de estado isolado para que as instalações de pacotes e os registros de instalação não
afetem seu estado normal do OpenClaw:

```bash
npm pack extensions/codex --pack-destination /tmp

OPENCLAW_STATE_DIR="$(mktemp -d)" \
OPENCLAW_ALLOW_PLUGIN_INSTALL_OVERRIDES=1 \
OPENCLAW_PLUGIN_INSTALL_OVERRIDES='{"codex":"npm-pack:/tmp/openclaw-codex-2026.5.8.tgz"}' \
pnpm openclaw onboard --mode local
```

Verifique o pacote instalado no diretório de estado:

```bash
find "$OPENCLAW_STATE_DIR/npm/projects" -path '*/node_modules/@openclaw/codex/package.json' -print
grep -R '"@openclaw/codex"' "$OPENCLAW_STATE_DIR/npm/projects"/*/package-lock.json
```

Para E2E de provedor ao vivo, carregue a chave de API real de um shell confiável ou de um
segredo de CI antes de iniciar o comando de teste. Não imprima chaves; informe somente a
origem e se a chave estava presente.
