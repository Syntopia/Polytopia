precision highp float;

uniform vec2 resolution;

uniform mat4 viewMatrix;
uniform vec3 cameraPosition;

uniform mat4 cameraWorldMatrix;
uniform mat4 cameraProjectionMatrixInverse;

// control-group: coordinate
uniform int Degree; // control[5, 3-5]
uniform float U; // control[1, 0-1]
uniform float V; // control[0, 0-1]
uniform float W; // control[0, 0-1]

// control-group: style
uniform float VRadius; // control[0.04, 0-0.2]
uniform float SRadius; // control[0.03, 0-0.2]
 
uniform bool displayFaces; // control[true]
uniform bool displaySegments; // control[true]
uniform bool displayVertices; // control[true]




#define PI 3.141592
// Symmetry group Degree.



#define face0Color vec3(1.0,0.0,0.0)
#define face1Color vec3(0.0,1.0,0.0)
#define face2Color vec3(0.0,0.0,1.0)
#define verticesColor vec3(1.0,0.0,0.0)
#define segmentsColor vec3(0.0,1.0,0.0)

vec3 nc,p,pab,pbc,pca;

void init() {
	float cospin=cos(PI/float(Degree)), scospin=sqrt(0.75-cospin*cospin);
	nc=vec3(-0.5,-cospin,scospin);
	pab=vec3(0.,0.,1.);
	pbc=normalize(vec3(scospin,0.,0.5));
	pca=normalize(vec3(0.,scospin,cospin));
	
	p=normalize((V*pab+W*pbc+U*pca));
}

vec3 fold(vec3 pos) {
	int max = int(Degree);
	for(int i=0;i<7;i++){
		pos.xy=abs(pos.xy);
		float t=-2.*min(0.,dot(pos,nc));
		pos+=t*nc;
		if (i>=max) break;
	}
	return pos;
}

float D2Planes(vec3 pos) {
	float d0=dot(pos,pab)-dot(pab,p);
	float d1=dot(pos,pbc)-dot(pbc,p);
	float d2=dot(pos,pca)-dot(pca,p);
	
	return max(max(d0,d1),d2);
}

float D2Segments(vec3 pos) {
	pos-=p;
	float dla=length(pos-min(0.,pos.x)*vec3(1.,0.,0.));
	float dlb=length(pos-min(0.,pos.y)*vec3(0.,1.,0.));
	float dlc=length(pos-min(0.,dot(pos,nc))*nc);
	return min(min(dla,dlb),dlc)-SRadius;//max(max(dla,dlb),max(dlc,dlp))-SRadius;
}

float D2Vertices(vec3 pos) {
	return length(pos-p)-VRadius;
}

float DE(vec3 pos) {
	vec3 oPos = pos;
	pos=fold(pos);
	float d=10000.;
	if(displayFaces) d=min(d,D2Planes(pos));
	if(displaySegments) d=min(d,D2Segments(pos));
	if(displayVertices) d=min(d,D2Vertices(pos));
	return d ;
}

vec3 baseColor(vec3 pos, vec3 normal){
	pos=fold(pos);
	float d0=1000.0,d1=1000.0,d2=1000.,dv=1000.,ds=1000.;
	if(displayFaces){
		d0=abs(dot(pos,pab)-dot(pab,p));
		d1=abs(dot(pos,pbc)-dot(pbc,p));
		d2=abs(dot(pos,pca)-dot(pca,p));
	}
	if(displaySegments) ds=D2Segments(pos);
	if(displayVertices) dv=D2Vertices(pos);
	float d=min(min(d0,min(d1,d2)),min(ds,dv));
	vec3 col=face0Color;
	if(d==d1) col=face1Color;
	if(d==d2) col=face2Color;
	if(d==ds) col=segmentsColor;
	if(d==dv) col=verticesColor;
	return col;
}