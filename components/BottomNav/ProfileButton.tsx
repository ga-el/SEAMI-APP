import { onAuthStateChanged } from 'firebase/auth';
import React, { useContext, useEffect, useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { ThemeContext } from '../../app/_layout';
import { initializeFirebase } from '../../firebase-config';
import Avatar from '../Avatar';
import { createStyles } from './styles';

interface ProfileButtonProps {
  isActive: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
  testID?: string;
}

const ProfileButton: React.FC<ProfileButtonProps> = ({
  isActive,
  onPress,
  accessibilityLabel,
  testID,
}) => {
  const themeContext = useContext(ThemeContext);
  const isDarkTheme = themeContext?.isDarkTheme ?? false;
  const styles = createStyles(isDarkTheme);
  
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('--');
  const { auth, db } = initializeFirebase();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Set user name
        if (user.displayName) {
          setUserName(user.displayName);
        } else if (user.email) {
          setUserName(user.email);
        } else {
          setUserName('--');
        }

        // Get avatar from Firestore
        try {
          const { getDoc, doc } = await import('firebase/firestore');
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserAvatarUrl(data.avatarUrl || null);
          } else {
            setUserAvatarUrl(null);
          }
        } catch (error) {
          console.error('Error loading user avatar:', error);
          setUserAvatarUrl(null);
        }
      } else {
        setUserName('--');
        setUserAvatarUrl(null);
      }
    });

    return unsubscribe;
  }, [auth, db]);

  return (
    <TouchableOpacity
      style={[
        styles.navigationButton,
        isActive && styles.navigationButtonActive,
      ]}
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      activeOpacity={0.7}
    >
      <View style={styles.profileAvatarContainer}>
        <Avatar 
          avatarUrl={userAvatarUrl} 
          nombre={userName} 
          size={32}
        />
        {isActive && <View style={styles.activeIndicator} />}
      </View>
    </TouchableOpacity>
  );
};

export default ProfileButton;