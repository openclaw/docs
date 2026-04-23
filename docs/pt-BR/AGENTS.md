---
x-i18n:
    generated_at: "2026-04-23T13:57:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8b046833f9a15dc61894ab9e808a09a9fb055ef7ada5c3d4893fbe5f70dec126
    source_path: AGENTS.md
    workflow: 15
---

# Guia de Documentação

Este diretório é responsável pela autoria da documentação, pelas regras de links do Mintlify e pela política de i18n da documentação.

## Regras do Mintlify

- A documentação é hospedada no Mintlify (`https://docs.openclaw.ai`).
- Links internos de documentação em `docs/**/*.md` devem permanecer relativos à raiz, sem sufixo `.md` ou `.mdx` (exemplo: `[Config](/gateway/configuration)`).
- Referências cruzadas de seção devem usar âncoras em caminhos relativos à raiz (exemplo: `[Hooks](/gateway/configuration-reference#hooks)`).
- Títulos da documentação devem evitar travessões e apóstrofos porque a geração de âncoras do Mintlify é frágil nesses casos.
- README e outros documentos renderizados no GitHub devem manter URLs absolutas da documentação para que os links funcionem fora do Mintlify.
- O conteúdo da documentação deve permanecer genérico: sem nomes pessoais de dispositivos, hostnames ou caminhos locais; use placeholders como `user@gateway-host`.

## Regras de conteúdo da documentação

- Em documentação, textos de UI e listas de seleção, ordene serviços/provedores alfabeticamente, a menos que a seção esteja descrevendo explicitamente a ordem de execução ou a ordem de detecção automática.
- Mantenha a nomenclatura de plugin empacotado consistente com as regras de terminologia de plugin definidas no `AGENTS.md` da raiz do repositório.

## i18n da documentação

- A documentação em idiomas estrangeiros não é mantida neste repositório. A saída gerada para publicação fica no repositório separado `openclaw/docs` (geralmente clonado localmente como `../openclaw-docs`).
- Não adicione nem edite documentação localizada em `docs/<locale>/**` aqui.
- Trate a documentação em inglês neste repositório, junto com os arquivos de glossário, como a fonte da verdade.
- Pipeline: atualize a documentação em inglês aqui, atualize `docs/.i18n/glossary.<locale>.json` conforme necessário e depois deixe a sincronização do repositório de publicação e `scripts/docs-i18n` rodarem em `openclaw/docs`.
- Antes de executar novamente `scripts/docs-i18n`, adicione entradas ao glossário para quaisquer novos termos técnicos, títulos de página ou rótulos curtos de navegação que devam permanecer em inglês ou usar uma tradução fixa.
- `pnpm docs:check-i18n-glossary` é a verificação para títulos alterados de documentação em inglês e rótulos curtos internos de documentação.
- A memória de tradução fica em arquivos gerados `docs/.i18n/*.tm.jsonl` no repositório de publicação.
- Veja `docs/.i18n/README.md`.
