
#define MaxSteps 80
#define MinimumDistance 0.0009
#define normalDistance     0.0002


#define Scale 3.0
#define FieldOfView 0.5
#define Jitter 0.06
#define FudgeFactor 1.0

#define Ambient 0.8
#define Diffuse 0.9
#define LightDir vec3(1.0)
#define LightColor vec3(0.3,0.3,0.3)
#define LightDir2 vec3(1.0,-1.0,1.0)
#define LightColor2 vec3(0.2,0.2,0.2)
#define Offset vec3(0.92858,0.92858,0.32858)

vec3 lightDir = LightDir;
vec3 lightDir2 = LightDir2;
vec3 spotDir = LightDir2;

// Two light sources. No specular 
vec3 getLight(in vec3 color, in vec3 normal, in vec3 dir) {
	float diffuse = max(0.0,dot(normal, lightDir)); // Lambertian
	
	float diffuse2 = max(0.0,dot(normal, lightDir2)); // Lambertian
	

	vec3 r = spotDir - 2.0 * dot(normal, spotDir) * normal;
	float s = max(0.0,dot(dir,-r));
	
	

	return
	(diffuse*Diffuse)*(LightColor*color) +
	(diffuse2*Diffuse)*(LightColor2*color) +
	pow(s,120.0)*vec3(0.4);
}

// Finite difference normal
vec3 getNormal(in vec3 pos) {
	vec3 e = vec3(0.0,normalDistance,0.0);
	
	return normalize(vec3(
			DE(pos+e.yxx)-DE(pos-e.yxx),
			DE(pos+e.xyx)-DE(pos-e.xyx),
			DE(pos+e.xxy)-DE(pos-e.xxy)
			)
		);
}

// Solid color 
vec3 getColor(vec3 normal, vec3 pos) {
	return vec3(0.6,0.6,0.7);
}


// Pseudo-random number
// From: lumina.sourceforge.net/Tutorials/Noise.html
float rand(vec2 co){
	return fract(cos(dot(co,vec2(4.898,7.23))) * 23421.631);
}

// Ambient occlusion approximation.
// Sample proximity at a few points in the direction of the normal.
float ambientOcclusion(vec3 p, vec3 n) {
	float ao = 0.0;
	float de = DE(p);
	float wSum = 0.0;
	float w = 1.0;
    float d = 1.0;
    float aoEps = 0.04;
	for (float i =1.0; i <6.0; i++) {
		// D is the distance estimate difference.
		// If we move 'n' units in the normal direction,
		// we would expect the DE difference to be 'n' larger -
		// unless there is some obstructing geometry in place
		float D = (DE(p+ d*n*i*i*aoEps) -de)/(d*i*i*aoEps);
		w *= 0.6;
		ao += w*clamp(1.0-D,0.0,1.0);
		wSum += w;
	}
	return clamp(ao/wSum, 0.0, 1.0);
}

vec4 rayMarch(in vec3 from, in vec3 dir) {
	// Add some noise to prevent banding
	float totalDistance = 0.;//Jitter*rand(fragCoord.xy+vec2(iTime));
	vec3 dir2 = dir;
	float distance;
	int steps = 0;
	vec3 pos;
	vec3 bestPos;
	float bestDist = 1000.0;
	float bestTotal = 0.0;
	for (int i=0; i <= MaxSteps; i++) {
		pos = from + totalDistance * dir;
		distance = DE(pos)*FudgeFactor;
		
		if (distance<bestDist) {
			bestDist = distance;
			bestPos = pos;
			bestTotal = totalDistance;
		}
		
		totalDistance += distance;
		if (distance < MinimumDistance) break;
		steps = i;
	}

	if (steps == MaxSteps) {
		pos = bestPos;
	}
	
	
	// Since our distance field is not signed,
	// backstep when calc'ing normal
	vec3 normal = getNormal(pos-dir*normalDistance*3.0);
	
	float ao = ambientOcclusion(pos,normal)*0.4;	
	
	vec3 bg = vec3(1);
	

	vec3 color = getColor(normal, pos);
	vec3 light = getLight(color, normal, dir);
	
	color = mix(color*Ambient+light,vec3(0),ao);
	
	if (steps == MaxSteps) {
		return vec4(mix(color,bg,min(bestDist/bestTotal*400.,1.0)),1.0);
	}
	return vec4(pow(color,vec3(0.6,0.5,0.5)),1.0);
} 


vec2 uv;
float rand(float c){
	return rand(vec2(c,1.0));
}

void main(void) {
	// This is taken from: https://raw.githubusercontent.com/mrdoob/three.js/master/examples/webgl_raymarching_reflect.html

	// screen position
	vec2 screenPos = ( gl_FragCoord.xy * 2.0 - resolution ) / resolution;

	// ray direction in normalized device coordinate
	vec4 ndcRay = vec4( screenPos.xy, 1.0, 1.0 );

	// convert ray direction from normalized device coordinate to world coordinate
	vec3 ray = ( cameraWorldMatrix * cameraProjectionMatrixInverse * ndcRay ).xyz;
	ray = normalize( ray );

	lightDir = normalize(cameraPosition);
	lightDir2 = normalize(cameraPosition + vec3(5,0,0));
	spotDir = normalize(vec3(-1.,-1.,-1.));
	init();
	gl_FragColor = vec4( rayMarch(cameraPosition, ray));
}
