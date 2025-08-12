import { StyleSheet, View } from 'react-native';
import Svg, { Rect, Ellipse, Polygon, Circle } from 'react-native-svg';

export function LoginIllustration() {
  return (
    <View style={styles.container}>
      <Svg width="100%" height={160} viewBox="0 0 300 160" style={styles.image}>
        {/* Sky */}
        <Rect width="300" height="160" fill="#E8F4FD"/>
        
        {/* Clouds */}
        <Ellipse cx="80" cy="30" rx="18" ry="10" fill="white" opacity="0.9"/>
        <Ellipse cx="95" cy="30" rx="15" ry="8" fill="white" opacity="0.9"/>
        <Ellipse cx="70" cy="30" rx="10" ry="6" fill="white" opacity="0.9"/>
        
        <Ellipse cx="220" cy="25" rx="16" ry="9" fill="white" opacity="0.9"/>
        <Ellipse cx="235" cy="25" rx="12" ry="7" fill="white" opacity="0.9"/>
        <Ellipse cx="210" cy="25" rx="8" ry="5" fill="white" opacity="0.9"/>
        
        {/* Trees - More detailed and varied */}
        <Ellipse cx="40" cy="140" rx="28" ry="38" fill="#4CAF50"/>
        <Ellipse cx="35" cy="135" rx="22" ry="32" fill="#66BB6A"/>
        <Ellipse cx="45" cy="130" rx="18" ry="28" fill="#81C784"/>
        <Ellipse cx="38" cy="125" rx="12" ry="20" fill="#A5D6A7"/>
        
        <Ellipse cx="260" cy="145" rx="32" ry="42" fill="#4CAF50"/>
        <Ellipse cx="255" cy="140" rx="26" ry="36" fill="#66BB6A"/>
        <Ellipse cx="265" cy="135" rx="22" ry="32" fill="#81C784"/>
        <Ellipse cx="258" cy="130" rx="16" ry="24" fill="#A5D6A7"/>
        
        <Ellipse cx="280" cy="150" rx="24" ry="32" fill="#4CAF50"/>
        <Ellipse cx="275" cy="145" rx="18" ry="26" fill="#66BB6A"/>
        <Ellipse cx="285" cy="140" rx="14" ry="20" fill="#81C784"/>
        
        {/* Ground/Grass */}
        <Rect x="0" y="150" width="300" height="10" fill="#8BC34A"/>
        
        {/* University Building - More detailed classical architecture */}
        <Rect x="100" y="80" width="100" height="70" fill="#F5F5DC"/>
        <Rect x="100" y="80" width="100" height="70" stroke="#D4AF37" strokeWidth="2"/>
        
        {/* Building Roof - More detailed */}
        <Polygon points="95,80 105,70 195,70 205,80" fill="#D4AF37"/>
        <Polygon points="98,80 102,72 198,72 202,80" fill="#B8860B"/>
        
        {/* Main Columns */}
        <Rect x="110" y="85" width="10" height="60" fill="#D4AF37"/>
        <Rect x="180" y="85" width="10" height="60" fill="#D4AF37"/>
        
        {/* Secondary Columns */}
        <Rect x="120" y="85" width="8" height="60" fill="#D4AF37"/>
        <Rect x="172" y="85" width="8" height="60" fill="#D4AF37"/>
        
        {/* Column Details */}
        <Rect x="108" y="83" width="14" height="4" fill="#B8860B"/>
        <Rect x="178" y="83" width="14" height="4" fill="#B8860B"/>
        <Rect x="118" y="83" width="12" height="4" fill="#B8860B"/>
        <Rect x="170" y="83" width="12" height="4" fill="#B8860B"/>
        
        {/* Windows - First Row */}
        <Rect x="115" y="95" width="14" height="18" fill="#87CEEB"/>
        <Rect x="115" y="95" width="14" height="18" stroke="#4682B4" strokeWidth="1"/>
        <Rect x="118" y="98" width="8" height="12" fill="#E0F6FF"/>
        
        <Rect x="135" y="95" width="14" height="18" fill="#87CEEB"/>
        <Rect x="135" y="95" width="14" height="18" stroke="#4682B4" strokeWidth="1"/>
        <Rect x="138" y="98" width="8" height="12" fill="#E0F6FF"/>
        
        <Rect x="155" y="95" width="14" height="18" fill="#87CEEB"/>
        <Rect x="155" y="95" width="14" height="18" stroke="#4682B4" strokeWidth="1"/>
        <Rect x="158" y="98" width="8" height="12" fill="#E0F6FF"/>
        
        <Rect x="175" y="95" width="14" height="18" fill="#87CEEB"/>
        <Rect x="175" y="95" width="14" height="18" stroke="#4682B4" strokeWidth="1"/>
        <Rect x="178" y="98" width="8" height="12" fill="#E0F6FF"/>
        
        {/* Windows - Second Row */}
        <Rect x="115" y="118" width="14" height="18" fill="#87CEEB"/>
        <Rect x="115" y="118" width="14" height="18" stroke="#4682B4" strokeWidth="1"/>
        <Rect x="118" y="121" width="8" height="12" fill="#E0F6FF"/>
        
        <Rect x="135" y="118" width="14" height="18" fill="#87CEEB"/>
        <Rect x="135" y="118" width="14" height="18" stroke="#4682B4" strokeWidth="1"/>
        <Rect x="138" y="121" width="8" height="12" fill="#E0F6FF"/>
        
        <Rect x="155" y="118" width="14" height="18" fill="#87CEEB"/>
        <Rect x="155" y="118" width="14" height="18" stroke="#4682B4" strokeWidth="1"/>
        <Rect x="158" y="121" width="8" height="12" fill="#E0F6FF"/>
        
        <Rect x="175" y="118" width="14" height="18" fill="#87CEEB"/>
        <Rect x="175" y="118" width="14" height="18" stroke="#4682B4" strokeWidth="1"/>
        <Rect x="178" y="121" width="8" height="12" fill="#E0F6FF"/>
        
        {/* Door */}
        <Rect x="140" y="130" width="20" height="20" fill="#8B4513"/>
        <Rect x="140" y="130" width="20" height="20" stroke="#654321" strokeWidth="1"/>
        <Rect x="143" y="133" width="14" height="14" fill="#A0522D"/>
        
        {/* Door handle */}
        <Circle cx="155" cy="140" r="1.5" fill="#FFD700"/>
        <Circle cx="155" cy="140" r="0.5" fill="#B8860B"/>
        
        {/* Building steps */}
        <Rect x="135" y="150" width="30" height="6" fill="#D4AF37"/>
        <Rect x="130" y="156" width="40" height="6" fill="#D4AF37"/>
        <Rect x="125" y="162" width="50" height="4" fill="#B8860B"/>
        
        {/* Building details */}
        <Rect x="95" y="78" width="110" height="2" fill="#B8860B"/>
        <Rect x="98" y="76" width="104" height="2" fill="#D4AF37"/>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  image: {
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
});

