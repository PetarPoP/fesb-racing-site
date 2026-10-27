# FRM 4 2023. – FESB Racing

Source: https://ups-fesb.hr/hr/projekti/motostudent-2/frm-4-2023/

# FRM 4 2023.

- Početna >

- Projekti >

- MotoStudent >

- FRM 4 2023.

# Tehničke karakteristike

- Motor: 50 HP, KTM 250 SX-F

- Akceleracija: 0-100km/h: 4,4s

- Ukupna težina: 95 kg

- Međuosovinski razmak: 1296±23 mm

# Nagrade

- 1. Mjesto u kategoriji akceleracije

- 1. Mjesto u MS1 Finals kategoriji

# POGONSKI SUSTAV

Za dizajn i optimizaciju usisnog, ispušnog, gorivnog i rashladnog sustava motora KTM 250 SX – F i evaluaciju performansi, razvijen je 1D model performansi motora koristeći AVL Boost . Simulacije vremena kruga provedene su korištenjem MATLAB-a i Open lap skripte kako bi se odredio najkorišteniji segment radnog područja, prosječno na 12040 RPM rasponu od 10000 do 14000 RPM. Ovi podaci poslužili su kao osnova za daljnju optimizaciju performansi motora putem AVL Boost-a. Četrnaest ključnih parametara je varirano, uključujući primarnu duljinu/promjer usisa, volumen zračne kutije, duljinu/promjer ulaza zraka i duljinu/promjer ispuha, među ostalima. Komparativna analiza u odnosu na tvornički motor otkrila je povećanje momenta od 13,5% i povećanje snage od 7,71% kroz optimizaciju. Posebno, vrhunac okretnog momenta pomaknut je s 12000 na 10000 RPM, dok je vrhunac snage ostao na 14000 RPM. Ova poboljšanja potvrđena su testiranjem na dinamometru . Kako bi se učinkovito prenijela ova povećana snaga na kotače uz održavanje laganog dizajna, provedene su modifikacije poput korištenja lakšeg lanca 415 , prilagođenog prednjeg lančanika i aluminijskog stražnjeg lančanika izrađenog od aluminija 7075-T6 .

# OVJES

FRM4 ima optimizirani sustav ovjesa, pažljivo analiziran korištenjem MATLAB -a i Altair Motion View -a. Simulacije vremena kruga, prilagođene trkaćoj stazi Motorland u Aragonu, bile su ključne za unapređenje performansi ovjesa. Precizan odabir točaka pričvršćivanja ovjesa usklađen je sa željenom krivuljom odziva, postigavši ravnotežu između krutosti i odzivnosti za optimalno iskustvo na stazi. Koristeći prednosti aluminija 7075-T6 , posebna pažnja posvećena je dizajnu komponenti, pažljivo optimiziranih i izrađenih od nule. Komponente prednjeg i stražnjeg ovjesa projektirane su kako bi osigurale željeno ponašanje, prilagodljivost i laganu konstrukciju. Stražnja vilica kao ključni element, izrađena je od aluminija 6082-T6 zbog svoje visoke granice tečenja od 503 MPa . Korištenjem tehnika obrade za oblikovanje u šuplje elemente, praćeno TIG zavarivanjem i toplinskom obradom , rezultiralo je strukturom visoke krutosti od 0,95 kNm/deg torzijske krutosti, uz održavanje minimalne težine.

# OPLATA

Oplata FRM4 sastoji se od prednjih i stražnjih blatobrana, gornjih i donjih dijelova oplate, i poklopca spremnika za gorivo. Početni geometrijski dizajn preuzet je s našeg prethodnog motocikla, zatim je pojednostavljen i simuliran u Ansys Fluent -u, omogućujući brzo generiranje mreže i iteraciju geometrije. Koristeći K-epsilon i GEKO modele turbulencije u CFD analizi, izračunat je koeficijent otpora zraka (cd) od 0,274 , praćen negativnim koeficijentom uzgona (cl) od 0,0165 . Cijeli proces izrade obavlja se unutar naše radionice . Počinje 3D printom modela te nanošenjem gelcoata i staklenih vlakana za izradu kalupa. Završni korak uključuje ručno laminiranje četiri sloja kompozitnih ugljičnih vlakana s epoksidnom smolom, osiguravajući lagan ali strukturalno čvrst dio s optimalnim svojstvima krutosti i mase. Posebno dizajnirana da bude lagana, ali otporna na testiranje i uvjete na stazi, rep motora to jest stražnja potkonstrukcija izrađena je od 450 g/m² preprega ugljičnih vlakana i osnovnog materijala. Korištenje vakuumskog sustava za pritiskanje slojeva na polirani MDF kalup, praćeno stvrdnjavanjem preprega u autoclave , osigurava da strukturni integritet potkonstrukcije odgovara simulacijama.

# KONSTRUKCIJA

Okvir šasije, pravi temelj ovog motocikla, nastao je kroz spoj SolidWorks CAD-a za početnu geometriju i simulacije u Ansys-u strukturne analize. Sinfonija inovacija i inženjerske briljantnosti orkestrirala je njezinu optimizaciju, fino podešavajući krutost i smanjujući težinu. Finalna 32. verzija, rezultirala je u 36 kromolijiskih čeličnih cijevi , pažljivo CNC obrađenih i besprijekorno spojenih. Hardox® 450 pružio je snagu nosačima motora i ovjesa, kroz preciznosti TIG zavarivanja uz WCrMo1Si kao dodatni materijal, rezultirajući izvrsnosti. Ukrašena zaštitnom plastifikacijom koji je završni sloj, s težinom od svega 8,9 kg , ali s torzijskom krutošću od 4 kNm/deg , šasija je svjedočanstvo o skladnom spoju forme i funkcije. Papučice, izrađene od aluminija Al 7075 T6 , su gotovo zanemarive mase dok omogućuju prilagodljivost, krojeno jedinstvenom poziciji I preferenci svakog vozača.

# ELEKTRONIKA

Ožičenje je dizajnirano koristeći EPLAN softver i izrađeno je u skladu sa standardima kako bi se osigurala maksimalna pouzdanost. Ožičenje je sastavljeno koristeći visokokvalitetne automobilske komponente. Korištene komponente su žice vojnih specifikacija ( Spec-44 ), DR-25 termo-skupljajući bužir različitih veličina, automobilski konektori Sumitomo DL, Deutsch, Amphenol. Krajevi žica su označeni oznakama kako bi se olakšala identifikacija.

Digitalni LCD zaslon na motoru povezan je s Taipan ECU -om putem samorazvijene CAN mreže te prikazuje najvažnije podatke kako bi vozaču pomogao u upravljanju motociklom, to uključujućuje brzinu, broj okretaja motora (RPM), temperaturu motora, napon baterije i trenutnu brzinu motocikla. Aplikacija koja pokreće zaslon izrađena je koristeći Qt platformu . Kako bi se optimiziralo vrijeme pokretanja aplikacije, razvijen je minimalistički Linux sustav koristeći Buildroot .

# Natjecanje

Održano 11.10.-15.10.2023. godine

- 1 mjesto u kategoriji akceleracija

- 1 mjesto u kategoriji MS1 Finali

- 4 put natjecanje na MotoStudentu

- 7 mjesto u kategorijama kočenje I najveća brzina

- 11 mjesto u najboljem dizajnu