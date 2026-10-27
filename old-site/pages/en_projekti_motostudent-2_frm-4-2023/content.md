# FRM 4 2023. – FESB Racing

Source: https://ups-fesb.hr/en/projekti/motostudent-2/frm-4-2023/

# FRM 4 2023.

- Home >

- Projects >

- MotoStudent >

- FRM 4 2023.

# General information

- Engine: 50 HP, KTM 250 SX-F

- Accelration: 0-100km/h: 4,4 s

- Wet weight: 95 kg

- Wheelbase: 1296±23 mm

# Awards

- 1st place in Acceleration category

- 1st place in MS1 Finals category

# POWERTRAIN

To design and optimize the KTM 250 SX - F engine's intake, exhaust, fuel, and cooling systems and evaluate performance, a 1D engine performance model was developed using AVL Boost. Lap time simulations were conducted using MATLAB and Open lap script to determine the most utilized segment of the powerband, averaging at 12040 rpm within the range of 10000 to 14000 rpm. This data served as the basis for further optimizing engine performance via AVL Boost. Fourteen key parameters were varied, including intake primary length/diameter, airbox volume, ram air length/diameter, and exhaust length/diameter, among others. Comparative analysis against the stock engine revealed a 13,5% increase in torque and a 7,71% boost in power through the optimization. Notably, the torque peak shifted from 12000 to 10000 rpm while the power peak remained at 14000 rpm. These enhancements were validated through dyno testing. To efficiently transfer this augmented power to the wheels while maintaining a lightweight design, modifications such as utilizing a lighter 415 chain, custom front sprocket, and aluminum rear sprocket were manufactured form 7075-T6 Aluminium.

# SUSPENSION

The FRM4 showcases an optimized suspension system, meticulously analyzed using MATLAB and Altair Motion View. Lap time simulations, tailored to the Aragon Motorland racetrack, were instrumental in refining the suspension's performance. Precise selection of suspension hardpoints aligned with the desired response curve, striking a balance between rigidity and responsiveness for an optimal on-track experience. Utilizing strengths of 7075-T6 Aluminium significant emphasis was placed on component design, meticulously optimized and created from scratch. Both front and rear suspension components were engineered to ensure the desired behavior, adjustability, and lightweight construction. The rear swingarm, a key element, was crafted from 6082 - T6 Aluminum because of its high yield strength of 503 MPa. Utilizing milling techniques to shape it into shells, followed by TIG welding and heat treatment, resulted in a high-rigidity structure of 0,95 kNm/deg of torsional stiffness while keeping weight at a minimum.

# FAIRING

The fairing of the FRM4 consists of the front and rear mudguards, upper and lower body parts, and the fuel tank cover. The initial geometric design was taken from our previous motorcycle and it was simplified and then simulated in Ansys Fluent, enabling quick mesh generation and geometry iteration. Leveraging K-epsilon and GEKO turbulence models in the CFD analysis, the resulting drag coefficient (cd) was calculated as 0,274, accompanied by a negative lift coefficient (cl) of 0,0165. The entire manufacturing process is completed in-house. It commences with 3D printing the models and applying gelcoat and glass fiber to create the mold. The final step involves hand-laminating four layers of composite carbon fiber with epoxy resin, ensuring a lightweight yet structurally sound part with optimal stiffness and mass properties. Specifically designed to be lightweight yet resilient to testing and track conditions, the tail subframe is manufactured using 450 g/m2  carbon fiber prepreg and core material. Employing vacuum bagging to press the layup against a polished MDF mold, followed by curing the prepreg in an autoclave, ensures the subframe's structural integrity aligns with simulations.

# CHASSIS

The space frame chassis, the very backbone of this motorcycle, came to life through a fusion of SolidWorks CAD magic for its initial geometry and Ansys structural analysis prowess. A symphony of innovation and engineering brilliance orchestrated its optimization, fine-tuning stiffness and shedding weight. The crescendo, the 32nd version, emerged from the 36 chromoly steel tubes, meticulously CNC milled and united seamlessly. Hardox® 450 lent its strength to the engine and suspension mounts, a ballet of precision through TIG welding with added WCrMo1Si filler rod, resulting in a canvas of excellence. Adorned with a powder-coated finish, boasting a mere 8,9 kg in weight yet wielding a torsional stiffness of 4 kNm/deg, a testament to the harmonious marriage of form and function. The pedals, crafted from Al 7075 T6, embody lightness while embracing adjustability, tailored for the unique imprint of each driver.

# ELECTRONICS

The wiring was designed using EPLAN software and is constructed according to standards to ensure maximum reliability. The wiring is assembled using high-quality automotive components to achieve flawless reliability. The components used are: Military spec wire (Spec-44), DR-25 heat-shrink tubing in various sizes, automotive connectors Sumitomo DL, Deutsch, Amphenol. Wire ends are identified using cable labels to facilitate identification.

A digital LCD display on the motor is connected to the Taipan ECU through the self-developed CAN network, and it shows the most important data to assist the driver in managing the motorcycle, including speed, RPM, engine temperature, battery voltage, and the motorcycle's current speed. The application that runs the display is made using the Qt framework. To optimize the application startup time, a minimalist Linux operating system was developed using Buildroot.

# Competition

Held on 11.10. – 15.10. 2023.

- 1st place in Acceleration category

- 1st place in MS1 Finals category

- 4th time participating

- 7th place in Brake and Vmax category

- 11th place in Best design category