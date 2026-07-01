---
read_when:
    - Analisando uploads para detectar abuso ou violações de política
    - Escrevendo docs de moderação ou runbooks de revisores
    - Decidindo se uma skill deve ser ocultada ou se um usuário deve ser banido
sidebarTitle: Acceptable Usage
summary: 'Política do marketplace: o que o ClawHub permite e o que ele não hospedará.'
title: Uso aceitável
x-i18n:
    generated_at: "2026-07-01T05:31:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Uso Aceitável

ClawHub hospeda Skills, plugins, pacotes e metadados de marketplace para OpenClaw.
Use esta página para decidir se conteúdo ou comportamento de publicação pertence ao
ClawHub.

Estas regras se aplicam ao que uma listagem faz, ao que ela pede que os usuários executem, como ela
se representa e como os publicadores usam as superfícies de descoberta, instalação e
confiança do ClawHub. Para estados de moderação e situação da conta, consulte
[Moderação e Segurança da Conta](/clawhub/moderation). Para direitos autorais ou outras reivindicações de direitos,
consulte [Solicitações de Direitos de Conteúdo](/clawhub/content-rights).

## Conteúdo permitido

O ClawHub acolhe conteúdo útil, compreensível e publicado de boa
fé.

| Categoria                                         | Permitido quando                                                                                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Produtividade de desenvolvedores                           | A listagem ajuda os usuários a criar, testar, migrar, depurar, documentar ou operar software.                                               |
| UI, dados e fluxos de trabalho de automação               | O escopo é claro, as credenciais necessárias são explícitas, e ações arriscadas incluem revisão, simulação, pré-visualização ou caminhos de confirmação. |
| Segurança defensiva, moderação e revisão de abuso | A ferramenta é apresentada para revisão autorizada, preserva evidências e mantém claros os limites de aprovação humana.                          |
| Fluxos de trabalho pessoais ou de equipe                       | O fluxo de trabalho usa contas baseadas em consentimento, configuração transparente e permissões explícitas.                                            |
| Catálogos mantidos                              | Cada listagem é distinta, útil, descrita com precisão e razoavelmente mantida.                                                |

O contexto importa. O mesmo tópico pode ser aceitável em um contexto defensivo restrito ou
baseado em consentimento e inaceitável quando empacotado como um fluxo de trabalho de abuso.

## Conteúdo proibido

O ClawHub não hospeda conteúdo cujo principal propósito seja abuso, fraude, execução
insegura ou violação de direitos.

| Categoria                                                    | Não permitido                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Acesso não autorizado ou contorno de segurança                      | Contorno de autenticação, tomada de conta, abuso de limite de taxa, tomada de chamada ao vivo ou de agente, roubo de sessão reutilizável ou aprovação automática de fluxos de pareamento para usuários não aprovados.                                                                                                                                                   |
| Abuso de plataforma e evasão de banimento                              | Contas furtivas após banimentos, aquecimento ou criação massiva de contas, engajamento falso, automação de múltiplas contas, publicação em massa, bots de spam ou automação criada para evitar detecção.                                                                                                                                          |
| Fraude, golpes e fluxos financeiros enganosos             | Certificados ou faturas falsos, fluxos de pagamento enganosos, divulgação de golpes, prova social falsa, fluxos de identidade sintética para fraude ou ferramentas de gasto/cobrança sem aprovação humana clara.                                                                                                                    |
| Enriquecimento invasivo à privacidade ou vigilância                 | Coleta de contatos para spam, doxxing, perseguição, extração de leads combinada com abordagem não solicitada, monitoramento encoberto, correspondência biométrica sem consentimento ou uso de dados vazados ou dumps de violações.                                                                                                                  |
| Personificação ou manipulação de identidade sem consentimento       | Troca de rosto, gêmeos digitais, influenciadores clonados, personas falsas ou outras ferramentas usadas para personificar ou enganar.                                                                                                                                                                                                 |
| Conteúdo sexual explícito ou geração adulta com segurança desativada | Geração de imagem, vídeo ou conteúdo NSFW; wrappers de conteúdo adulto em torno de APIs de terceiros; ou listagens cujo principal propósito seja conteúdo sexual explícito.                                                                                                                                                       |
| Requisitos de execução ocultos, inseguros ou enganosos        | Comandos de instalação ofuscados, instaladores pipe-to-shell, como conteúdo baixado executado com `sh` ou `bash` sem revisibilidade clara, requisitos não declarados de segredo ou chave privada, execução remota de `npx @latest` sem revisibilidade clara ou metadados que escondem o que a listagem realmente precisa para executar. |
| Material que infringe direitos autorais ou viola direitos           | Republicar a skill, plugin, docs, ativos de marca ou código proprietário de outra pessoa sem permissão; violar termos de licença; ou se passar pelo autor ou publicador original.                                                                                                                            |

## Comportamento proibido no marketplace

O ClawHub também analisa como os publicadores usam o marketplace. Não use o ClawHub para
manipular descoberta, métricas, sinais de confiança, sistemas de moderação ou a
atenção dos usuários.

Comportamento proibido no marketplace inclui:

- publicação em massa de grandes números de listagens de baixo esforço, duplicativas, provisórias ou
  geradas por máquina que não parecem ter valor real para usuários
- inundar superfícies de pesquisa ou categoria com skills ou plugins quase idênticos
- publicar centenas de listagens com pouco ou nenhum uso, manutenção, clareza de origem
  ou diferenciação significativa
- inflar artificialmente instalações, downloads, estrelas ou outras métricas de
  engajamento por meio de automação, loops de autoinstalação, contas falsas, atividade
  coordenada, engajamento pago ou outro comportamento não orgânico
- criar ou alternar contas para evitar moderação, banimentos, limites de publicador ou
  revisão do marketplace
- enganar usuários sobre propriedade, origem, recursos, postura de segurança,
  requisitos de instalação ou afiliação com outro projeto ou publicador
- enviar repetidamente conteúdo que já foi ocultado, removido ou bloqueado
  sem corrigir o problema subjacente

A publicação em alto volume não é automaticamente abuso. Grandes catálogos são aceitáveis
quando as listagens são significativamente diferentes, descritas com precisão, mantidas
e usadas por usuários reais. Grandes catálogos se tornam um problema de confiança e segurança quando
o volume é combinado com listagens superficiais, duplicativas, enganosas, sem manutenção ou
promovidas artificialmente.

## Direitos de conteúdo

Se você acredita que conteúdo no ClawHub infringe seus direitos autorais ou outros direitos, use
[Solicitações de Direitos de Conteúdo](/clawhub/content-rights). Não use denúncias normais do marketplace
para reivindicações de direitos autorais ou direitos, a menos que a listagem também seja insegura,
maliciosa ou enganosa.

## Revisão e aplicação

O ClawHub pode usar verificações automatizadas, sinais estatísticos de abuso, denúncias de usuários e
revisão da equipe para identificar conteúdo inseguro ou comportamento abusivo de publicação. Um sinal
não prova abuso por si só; ele ajuda o ClawHub a decidir o que precisa de revisão.

Podemos:

- ocultar, reter, remover, excluir logicamente ou, quando compatível com o tipo de recurso,
  excluir permanentemente listagens que violem as regras
- bloquear downloads ou instalações de versões inseguras
- revogar tokens de API
- excluir logicamente conteúdo associado
- restringir acesso de publicação
- banir infratores reincidentes ou graves

Não garantimos aplicação com aviso prévio para abusos óbvios. Consulte
[Moderação e Segurança da Conta](/clawhub/moderation) para denúncias, retenções de moderação,
listagens ocultas, banimentos e situação da conta.
